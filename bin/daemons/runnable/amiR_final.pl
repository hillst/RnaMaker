#!/usr/bin/perl
use strict;
use warnings;
#use lib '/home/cgrb/cgrblib-dev/perl5';
#use RNA;
use Cwd;
use Getopt::Std;

###############################################
#  get input
###############################################
my ($seq, $name, %opt, $type, $syntasis, $orig);
getopts('s:n:h:t:a:', \%opt);
var_check();

my $cwd = cwd();

#print our result to stdout so the daemon can catch it
print calculate_oligo();

sub calculate_oligo{
    my ($rev, @seqs, @realstars, $star1, $realstar, $oligo1, $oligo2, $c, $g, $n, $string, $bsa1, $bsa2);
    $rev = reverse $seq;
    $rev =~ tr/ACGTacgt/TGCAtgca/;
    ################################################
    #  Need to insert loop changing the 11th NT ####
    ################################################
    my @temp = split //, $rev;
    $c = $temp[10];
    $g = $temp[2];
    $n = $temp[20];

    if ($g !~ /G/i and $type ne 'syntasi') {
        print STDERR "Warning: we recommend a C at amiR position 19, in order to have a 5' G on the miR*\n";
    }
    if ($n !~ /A/i and $type ne 'syntasi') {
        print STDERR "Warning: we recommend a 5' U on the miR\n";
    }

    if ($c =~ s/A/C/gi) {
        
    } elsif ($c =~ s/G/T/gi) {
        
    } elsif ($c =~ s/C/A/gi) {
        
    } elsif ($c =~ s/T/G/gi) {
        
    }

    if ($type eq 'eudicot') {
        $star1 = substr($rev,0,10).$c.substr($rev,11,10);
        $oligo1 = $seq.'ATGATGATCACATTCGTTATCTATTTTTT'.$star1;
        #print "$oligo1\n";
        $oligo2 = reverse $oligo1;
        $oligo2 =~ tr/ACTGacgt/TGACtgca/;
        $realstar = substr($star1,2,20);
        $realstar = $realstar.'CA';
        $string = 'AGTAGAGAAGAATCTGTA'.$oligo1.'CATTGGCTCTTCTTACT';
        $bsa1 = 'TGTA';
        $bsa2 = 'AATG';
    } elsif ($type eq 'monocot') {
        $star1 = substr($rev,0,10).$c.substr($rev,11,9).'C';
        $oligo1 = $seq.'ATGATGATCACATTCGTTATCTATTTTTT'.$star1;
        $oligo2 = reverse $oligo1;
        $oligo2 =~ tr/ATGCatgc/TACGtacg/;
        $realstar = substr($star1,2,20);
        $realstar = $realstar.'CA';
        $string = 'GGTATGGAACAATCCTTG'.$oligo1.'CATGGTTTGTTCTTACC';
        $bsa1 = 'CTTG';
        $bsa2 = 'CATG';
    } elsif ($type eq 'syntasi'){
        @seqs = split(",", $seq);
        $bsa1 = "ATTA";
        $bsa2 = "GTTC";
        my $string = "";
       
        foreach(@seqs){
            $string .= $_;
            $star1 = substr($string,0,10).$c.substr($string,11,10);
            $realstar = substr($star1,2,20);
            $realstar = $realstar.'CA';
            push(@realstars, $realstar);
        }
        if ($string !~ /^[ACTGU]+$/gi){
            print STDERR "Irregular values present, please use A, C, T, G or U\n";
            exit 0;
        }
        my @tokens =  split //, $string;
        for(my $i = 0; $i < scalar(@tokens); $i+=21){
            if ($tokens[$i]  !~ /[TU]/i){
                print STDERR "Warning: we recommend a U on the 5' end of each syntasiRNA";
                last;
            }
        }
        #first oligo is bsa1 . seq1 ... seqn
        $orig = $seq;
        $seq = $string;
        $string = $bsa1 . $seq;
        
        $oligo1 = $string;
        $oligo2 = reverse $seq;
        $oligo2 =~ tr/ACTGUacgtu/TGACAtgcaa/;
        #second oligo is bsa2 . reverse complement of the syntasiRNA
        $oligo2 = $bsa2 . $oligo2;
        $realstar = join(',', @realstars);
    } else {
	    print STDERR " Foldback type $type not supported.\n\n";
	    exit 1;
    }
    my $result = "";
    if ($type eq 'syntasi'){
        #syntasi name will be as a csv produced both by the front end and the results.
        $result = "{ \"results\": { \"syntasiRNA\": \"$seq\", \"Forward Oligo\": \"$oligo1\", \"Reverse Oligo\": \"$oligo2\", \"name\": \"$name\", \"seq\": \"$orig\", \"miRNA*\": \"$realstar\", \"syntasis\": \"$syntasis\"  }}";
    } else{
        $result = "{ \"results\": {\"amiRNA\": \"$seq\", \"miRNA*\": \"$realstar\", \"Forward Oligo\" : \"$oligo1\", \"Reverse Oligo\": \"$oligo2\", \"name\": \"$name\"}}";
    }
    return $result;
}
########################
#reverse compement of DNA#
########################
exit;

sub fold {
	my $prefix = shift;
	my $mir = shift;
	my $star = shift;
	my $stem = shift;
	my ($pre, $post);
	my $textX = 0;
	my $textY = 2;
	$mir =~ s/T/U/g;
	$star =~ s/T/U/g;
	$stem = uc($stem);
	$stem =~ s/T/U/g;
	# Fold MIRNA
	my $opt_str;
	#open FOLD, "echo $stem | /home/mcb/fahlgren/bin/ViennaRNA/bin/RNAfold -d2 -T 22 -noLP -noPS |";
	open FOLD, "echo $stem | RNAfold -d2 -T 22 -noPS |";
	while (my $row = <FOLD>) {
		if ($row =~ /^(.+) \(/) {
			$opt_str = $1;
		}
	}
	close FOLD;
	
	# Make the left and top pos variables in PS
	$pre .= "/leftpos xmin xmax add 2 div size 2 div sub def\n";
	$pre .= "/toppos ymin ymax add 2 div size 2 div add def\n";

	# Write the sequence name onto the image
	$pre .= "/HelveticaBold .5 size 350 div add LabelFont\n";  # Font for precursors
	$pre .= "leftpos size 100 div add toppos size 100 div $textY mul sub moveto\n";
	$pre .= "(". $prefix .") show\n";
	$textY += 5;
	$pre .= "/Helvetica 0 size 450 div add LabelFont\n";  # Font to use for miRs

	# Locate and mark a subsequence to be highlighted
	my $mir_color = "1 0 0";
	my $star_color = "0 1 0";
	# Find more than one occurance of substr, if exists
	my $start = 0;
	while ($start = index($stem, $mir, $start) + 1) {
		my $stop = $start + length($mir) - 1;
		if ($start) {
			$pre .= "$mir_color setrgbcolor\n";
			$pre .= "leftpos size 100 div add toppos size 100 div $textY mul sub moveto\n";
			$pre .= "(  ) show\n";
			$textY+=4;
			$post .= "$start $stop 2 $mir_color omark\n";
		}
	}
	$start = 0;
	while ($start = index($stem, $star, $start) + 1) {
		my $stop = $start + length($star) - 1;
		if ($start) {
			$pre .= "$star_color setrgbcolor\n";
			$pre .= "leftpos size 100 div add toppos size 100 div $textY mul sub moveto\n";
			$pre .= "(  ) show\n";
			$textY+=4;
			$post .= "$start $stop 2 $star_color omark\n";
		}
	}
	$pre .= "0 0 0 setrgbcolor\n";
	# Label 3' and 5' and interval bases
	$post .= "1"                                    . " 0.5 0 (5') Label\n";
	$post .= length($stem)      . " 0.5 0 (3') Label\n";
	for (my $i = 20; $i < length($stem); $i += 20) {
		$post .= "$i 0.5 0 ($i) Label\n";
	}
	# Output annotated sequence to a postscript file
	$pre .= "/HelveticaBold .8 LabelFont\n";
	RNA::PS_rna_plot_a($stem, $opt_str, "$cwd/$prefix.ps", $pre, $post);
	`ps2pdf $prefix.ps $prefix.pdf`;
	print STDERR " Made $cwd/$prefix.ps\n";
}


sub var_check {
	if ($opt{'h'}) {
        var_error();
    }
    if ($opt{'n'}) {
		$name = $opt{'n'};
	} else {
		var_error();
	}
    if ($opt{'a'}){
        $syntasis = $opt{'a'};
    } else {
        $syntasis = "";
    }
	if ($opt{'t'}) {
		$type = $opt{'t'};
	} else {
		var_error();
	}
	if ($opt{'s'}) {
		$seq = $opt{'s'};
        if (length($seq) != 21 and $type ne "syntasi" ){
            print "Incorrect Length, please enter 21 nt\n";
			exit 0;
		}
		if ($seq !~ /^[ACTGU]+$/gi and $type ne "syntasi"){
			print "Irregular values present, please use A, C, T, G or U\n";
            exit 0;
		}
		$seq =~ s/U/T/gi;
	} else {
		var_error();
	}
}

sub var_error {
	print STDERR "This script will design oligos to clone the inputed artificial microRNA.\n";
	print STDERR "Usage: amiR_final.pl -s <amiRNA sequence> <amiRNA name>\n";
	print STDERR " -s     The amiRNA sequence.\n";
    print STDERR " -a     A comma separated list of syntasi names. If none is provided there will be no name listed";
	print STDERR "\n";
	print STDERR " -n     The amiRNA name.\n";
	print STDERR "\n";
	print STDERR " -t     Foldback type (eudicot, monocot, or syntasi).\n";
	print STDERR "\n\n";
	exit 0;
}












