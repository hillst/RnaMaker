#!/usr/bin/perl
use strict;
use warnings;
use POSIX qw( ceil floor );
use Config::Tiny;
use Getopt::Std;
use DBI;
use constant DEBUG => 1;

my (%opt, $accession, $infile, $species, $gene_seq, $gene_id, @sites, $offTargetDB, $offLimit, $resultLimit, @opt, @subopt, $fb);
getopts('a:f:s:d:l:r:t:',\%opt);
var_check();

my $conf_file = '/var/www/asrp/sites/amirna/amiRNA_tool.conf';
my $conf = Config::Tiny->read($conf_file);

#should be relative to the daemon's execution path, or make it absolute
my $db = '/var/www/RnaMaker/bin/daemons/amirna_dbs/transcripts.sqlite3';
# Connect to database, initialize database handler
my $dbh = DBI->connect("dbi:SQLite:dbname=$db","","");
my $sth = $dbh->prepare("SELECT * FROM `$species` WHERE `accession` = ?");

print STDERR " Your settings: Result limit = $resultLimit, Off-target limit = $offLimit\n" if (DEBUG);

if ($infile) {
	#open (IN, $infile) or die "Cannot open $infile: $!\n\n";
	#while (my $line = <IN>) {
	#	chomp $line;
	#	if ($line =~ /\>(.+)/) {
	#		$gene_id = $1;
	#	} else {
	#		$gene_seq .= $line;
	#	}
	#}
	#close IN;
	#if (!$gene_id) {
	#	$gene_id = 'query';
	#}
	$gene_seq = $infile;
	$gene_id = 'Target';
} else {
	$gene_id = $accession;
	$sth->execute($accession);
	while (my $row = $sth->fetchrow_hashref) {
		$gene_seq = $row->{'sequence'};
	}
#	open GET, "/usr/bin/blastdbcmd -db $conf->{$species}->{'mRNA'} -entry '$accession' |";
#	while (my $line = <GET>) {
#		chomp $line;
#		next if ($line =~ /\>/);
#		$gene_seq .= $line;
#	}
#	close GET;
  if ($gene_seq eq '') {
    print "<div class=\"set\">\n";
    print "  <span>Your gene was not found in the selected database</span>";
    print "</div><br>";
    exit 0;
  }
}

my %bp;
$bp{'A'} = 'T';
$bp{'T'} = 'A';
$bp{'G'} = 'C';
$bp{'C'} = 'G';

my $siteCount = 0;
#while ($gene_seq =~ /(..[ACT].................A)/gi) {
#while ($gene_seq =~ /[GTCA](..G.................[AG])/gi) {
#while ($gene_seq =~ /C(..G.......[CU].........A)/gi) {
while ($gene_seq =~ /[AGC](..G.................[AG])/gi) {
	my $site = $1;
	if ($gene_seq =~ /^(.*$site)/) {
		my $match = $1;
		my $start = (length($match) - length($site) + 1);
		my $end = length($match);
		my %hash;
		$hash{'start'} = $start;
		$hash{'end'} = $end;
		$hash{'seq'} = $site;
		$hash{'name'} = $siteCount;
		$sites[$start] = \%hash;
		$siteCount++;
	}
}
print STDERR " Found $siteCount potential sites... \n" if (DEBUG);

my $amiRNAcount = 0;
my $id = 1;
my $counter = 1;
my $middle = ceil(length($gene_seq) / 2);
my $posLeft = $middle;
my $posRight = $middle;
while ($amiRNAcount < $resultLimit) {
	last if ($posLeft < 1 && $posRight > length($gene_seq));
	if ($counter % 2 == 0) {
		if ($posRight > length($gene_seq)) {
			$counter++;
			next;
		}
		if (exists($sites[$posRight])) {
			my $amiRNA = get_amiRNA($sites[$posRight]);
			my @results = off_target_check($amiRNA);
			my $offTargetCount = shift(@results);
			if ($offTargetCount <= $offLimit) {
				print STDERR " $offTargetCount off-targets predicted\n" if (DEBUG);
				push @opt, print_result($amiRNA,@results);
				$amiRNAcount++;
			} elsif ($offTargetCount <= $offLimit + 2) {
				print STDERR " Site suboptimal, $offTargetCount off-targets predicted\n" if (DEBUG);
				push @subopt, print_result($amiRNA,@results);
			} else {
				print STDERR " Site failed, $offTargetCount off-targets predicted\n" if (DEBUG);
			}
			$posRight++;
		} else {
			$posRight++;
		}
	} else {
		if ($posLeft < 1) {
			$counter++;
			next;
		}
		if (exists($sites[$posLeft])) {
			my $amiRNA = get_amiRNA($sites[$posLeft]);
			my @results = off_target_check($amiRNA);
			my $offTargetCount = shift(@results);
			if ($offTargetCount <= $offLimit) {
				print STDERR " $offTargetCount off-targets predicted\n" if (DEBUG);
				push @opt, print_result($amiRNA,@results);
				$amiRNAcount++;
			} elsif ($offTargetCount <= $offLimit + 2) {
				print STDERR " Site suboptimal, $offTargetCount off-targets predicted\n" if (DEBUG);
				push @subopt, print_result($amiRNA,@results);
			} else {
				print STDERR " Site failed, $offTargetCount off-targets predicted\n" if (DEBUG);
			}
			$posLeft--;
		} else {
			$posLeft--;
		}
	}
	$counter++;
}

print "  <span class=\"section_header\">Optimal results</span>\n";
foreach my $line (@opt) {
	print $line;
}
print "  <span class=\"section_header\">Suboptimal results</span>\n";
foreach my $line (@subopt) {
	print $line;
}

exit;

sub print_result {
	my $site = shift;
	my @tf = @_;
	my $homology = homology_string($site);
	my @output;
	#print "<a href=\"http://bioinformatics.danforthcenter.org/amiRNA/methods/oligo.php?name=amiRNA$site->{'name'}&seq=$site->{'amiRNA'}\" target=\"_blank\"><div class=\"set\">\n";
	push @output, "<div class=\"set\">\n";
	push @output, "  <span>amiRNA: 5' $site->{'amiRNA'} 3', start=$site->{'start'}, end=$site->{'end'}</span><br>\n";
	push @output, "  <span id=\"alignment\">5' ".$site->{'seq'}." 3'</span><br>\n";
	push @output, "  <span id=\"alignment\">&nbsp&nbsp&nbsp".$homology."</span><br>\n";
	push @output, "  <span id=\"alignment\">3' ".reverse($site->{'amiRNA'})." 5'</span><br><br>\n";
	push @output, "  <span class=\"section_header\">TargetFinder results</span><br>\n";
	push @output, "  <hr class=\"section\" />\n";
	my $cycles = scalar(@tf) / 6;
	my $e = 0;
	for (my $i = 1; $i <= $cycles; $i++) {
	  push @output, "  <span>Target: $tf[$e]</span><br>\n";
		$e++;
		push @output, "  <span>Score:&nbsp $tf[$e]</span><br>\n";
		$e++;
		push @output, "  <span>Range:&nbsp $tf[$e]</span><br><br>\n";
		$e++;
    push @output, "  <span id=\"alignment\">target 5' $tf[$e] 3'</span><br>\n";
		$e++;
		push @output, "  <span id=\"alignment\">&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp$tf[$e]</span><br>\n";
		$e++;
		push @output, "  <span id=\"alignment\">miRNA&nbsp 3' $tf[$e] 5'</span><br><br><br>\n";
		$e++;
	}
	push @output, "<span class=\"section_header\">OligoDesigner results</span><br>";
	push @output, "<hr class=\"section\" />";
	open OLIGO, "./amiR_final.pl -s $site->{'amiRNA'} -n $site->{'name'} -t $fb | ";
	while (my $line = <OLIGO>) {
		push @output, $line;
	}
	close OLIGO;
	#print "</div></a><br>\n";
	push @output, "</div><br>\n";
	return @output;
}

sub get_amiRNA {
	my $site = shift;
	my @bases = split //, $site->{'seq'};
	$site->{'amiRNA'} .= shift(@bases);
#	for (1..2) {
#		$site->{'amiRNA'} .= shift(@bases);
#	}
	$site->{'amiRNA'} .= $bp{shift(@bases)};
	shift(@bases);
	$site->{'amiRNA'} .= 'C';
	for (1..17) {
		my $base = shift(@bases);
		$site->{'amiRNA'} .= $bp{$base};
	}
	$site->{'amiRNA'} .= 'T';
	$site->{'amiRNA'} = reverse($site->{'amiRNA'});
	return $site;
}

sub homology_string {
	my $site = shift;
	my $amiRNA = reverse($site->{'amiRNA'});
	my $homology = "";
	for (my $i = 0; $i <= 20; $i++) {
		my $tbase = substr($site->{'seq'},$i,1);
		my $abase = substr($amiRNA,$i,1);
		if ($abase eq $bp{$tbase}) {
			$homology .= '|';
		} else {
			$homology .= '&nbsp';
		}
	}
	return $homology;
}

sub off_target_check {
	my $site = shift;
	my $offCount = 0;
	my $gid = $gene_id;
	$gid =~ s/\.\d+$//;
	my @results;
    open TF, "/var/www/RnaMaker/bin/daemons/runnable/targetfinder.pl -s $site->{'amiRNA'} -d $offTargetDB -q amiRNA |";
	while (my $line = <TF>) {
		if ($line =~ /^HIT=/) {
			if ($line !~ /$gid/) {
				$offCount++;
			}
			next;
		}
		push @results, $line;
	}
	close TF;
	return ($offCount, @results);
}

sub var_check {
	if (!$opt{'a'} && !$opt{'f'}) {
		print STDERR " You need an input file or a gene accession ID!\n";
		var_error();
	}
	if ($opt{'a'}) {
		$accession = $opt{'a'};
		if ($opt{'s'}) {
			$species = $opt{'s'};
		} else {
			print STDERR " You need to define a species!\n";
			var_error();
		}
	}
	if ($opt{'f'}) {
		$infile = $opt{'f'};
	}
	if ($opt{'d'}) {
		$offTargetDB = $opt{'d'};
	} else {
		print STDERR " You need an off-target database!\n";
		var_error();
	}
	if ($opt{'l'}) {
		$offLimit = $opt{'l'};
	} else {
		$offLimit = 0;
	}
	if ($opt{'r'}) {
		$resultLimit = $opt{'r'};
	} else {
		$resultLimit = 3;
	}
	if ($opt{'t'}) {
		$fb = $opt{'t'};
	} else {
		$fb = 'eudicot';
	}
}

sub var_error {
	print STDERR "\n\n";
	print STDERR " This script will generate a list of amiRNA target sites for a given input gene\n";
	print STDERR " You did not provide the correct options.\n";
	print STDERR " Usage: generate_amiRNA_list.pl [OPTIONS]\n";
	print STDERR " REQUIRED:\n";
	print STDERR " -a <Gene accession> OR -f <FASTA-file>\n";
	print STDERR " -d <Off target database> (FASTA-formated sequence database)\n";
	print STDERR " -s <Species> (only required if -a is used)\n";
	print STDERR "     Choices:     A_THALIANA\n";
	print STDERR "                  A_LYRATA\n";
	print STDERR " -l <off-target limit> [INT], DEFAULT = 0 off-targets\n";
	print STDERR " -r <result limit> [INT], DEFAULT = 3 results\n";
	print STDERR " -t <Foldback type> [STRING], DEFAULT = eudicot\n";
	print STDERR "\n\n";
	exit 0;
}
