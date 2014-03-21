$().ready(function(){
    function baseState(){
        wiz = new Wizard();
        wiz.addAllYN();
        //add a help pane and place it there
        wiz.notePane.append($(".x-wrapper").outerHTML());
        wiz.notePane.append("Click ‘Design syntasiRNAs’ if you want to identify optimal syntasiRNA guide sequences that target your gene(s) of interest. Choose ‘Generate oligos’ if you already have syntasiRNA guide sequences and you just want to generate oligos to clone the syntasiRNAs in a BsaI-ccdB vector containing the Arabidopsis TAS1c precursor.");
        wiz.setXClose();
        //if it has children you probably want to append.
        wiz.textPane.append("Do you need to design syntasiRNAs or do you already have syntasiRNA sequence(s) and only need to generate oligos for cloning?");
        wiz.setYesText("Design syntasiRNAs");
        wiz.setNoText("Generate Oligos");
        wiz.setYes(cb_designSyntasiRNA1);
        wiz.setNo(cb_generateOligos1);
    }
    function cb_designSyntasiRNA1(){
        wiz = new Wizard(wiz);
        wiz.addAllYN();
        wiz.notePane.append($(".x-wrapper").outerHTML());
        wiz.notePane.append("Select a species and click ‘Yes’ if you are going to express your syntasiRNAs in any of the species listed. Note that only Arabidopsis thaliana produces miR173 required for triggering syntasiRNA biogenesis, therefore if you select another species you should co-express miR173 to produce syntasiRNAs. Click ‘No’ if you are going to express your syntasiRNA(s) in another species. If you want us to add a new specie contact us at site@carringtonlab.org.");
        wiz.setXClose();
        wiz.textPane.append("Will you use your syntasiRNA in one of the following species?");
        wiz.textPane.append($("#species").html());
        wiz.setYes(cb_designSyntasiRNA2); //make sure it saves the species
        wiz.setNo(cb_generateOligos2); 
        $(wiz.yesButton).text("Yes");
        $(wiz.noButton).text("No");
        wiz.setBack(function(){
            cb_revertState(wiz);
        });
        
    }
    function cb_designSyntasiRNA2(){
        wiz.species = $("#database option:selected").text();
        wiz.speciesId = $("#database option:selected").val();
        wiz = new Wizard(wiz);
        wiz.restoreFormFields(); //gets species/speciesid
        wiz.addAllYN();
        wiz.notePane.append($(".x-wrapper").outerHTML());
        wiz.notePane.append("Click ‘Annotated transcript(s)’ if you have gene ID(s). Click ‘Unannotated/exogenous transcript(s)’ if you want to target transcripts that do not have an assigned gene ID or are not found in the selected reference transcriptome.");
        wiz.setXClose();
        wiz.textPane.append("Do you want to target annotated transcript(s) (Option 1) or unannotated/exogenous transcript(s)? (Option 2)");
        wiz.setYesText("Option 1");
        wiz.setNoText("Option 2");
        //work in progress
        //wiz.noButton.css("font-size", "16px").css("height", height);
        wiz.setYes(cb_designSyntasiRNA3_annotated);
        wiz.setNo(cb_designSyntasiRNA3_unannotated);
        wiz.setBack(function(){ cb_revertState(wiz); });
    }
    function cb_designSyntasiRNA3_annotated(){
        wiz = new Wizard(wiz);
        wiz.restoreFormFields(); 
        wiz.addAllNB();
        $("#sequence").val(""); //clear form?
        $("#gene").val("");
        wiz.textPane.append("Enter a target gene ID. Click the '+' button for entering additional target gene IDs to target multiple genes.");
        wiz.textPane.append( $("#transcript-lookup").outerHTML() );
        wiz.textPane.find( $("#transcript-lookup").addClass("transcript-lookup") );
        wiz.addPlusButton( ".transcript-lookup" );
        wiz.setNext(cb_designSyntasiRNA4_a);
        wiz.setBack(function(){ cb_revertState(wiz); });
    }
    function cb_designSyntasiRNA3_unannotated(){
        wiz = new Wizard(wiz);
        wiz.restoreFormFields();
        wiz.addAllNB();
        $("#sequence").val("");
        $("#gene").val("");
        wiz.textPane.append("Enter or paste FASTA sequence(s) of target transcript(s)");
        wiz.textPane.append( $("#wizard-transcript").outerHTML() );
        wiz.textPane.find( $("#wizard-transcript").addClass("wizard-transcript") );
        wiz.textPane.after($(".result").outerHTML());
        $("#wizard-pane").find(".result").removeClass("result").addClass("my-result");
        wiz.setNext(function(){
            var fasta = wiz.textPane.find("#sequence").val().split("\n");
            wiz.wizardPane.find(".my-result").removeClass("alert alert-danger").addClass("hidden").text("");
            if (fasta.length < 2 || fasta.length % 2 != 0){
                wiz.wizardPane.find(".my-result").removeClass("hidden").addClass("alert alert-danger").text("Please insert a fasta sequence");
                return;
            }
            for (var i = 0; i < fasta.length; i++){
                if ( i % 2 === 0){
                    if (fasta[i].substr(0,1) != ">"){
                        wiz.wizardPane.find(".my-result").removeClass("hidden").addClass("alert alert-danger").text("Please insert a valid fasta sequence");
                        return;
                    } 
                } else{
                    //reserved for potential alphabet test
                }
            }
            cb_designSyntasiRNA4_u();
        }); 
        wiz.setBack(function() { cb_revertState(wiz); });
    }
    //annotated
    function cb_designSyntasiRNA4_a(){
        var transid = "";
        wiz.textPane.find(".gene").each(function(){
            transid += $(this).val() + ",";
        }); 
        transid = transid.substring(0, transid.length-1);
        if (transid != "") {
            wiz.transcriptId = transid;
        }
        wiz = new Wizard(wiz);
        wiz.restoreFormFields();
        wiz.addAllYN();
        wiz.notePane.append($(".x-wrapper").outerHTML());
        wiz.notePane.append("Clicking ‘Yes’ will activate a target prediction module. Results that have predicted undesired targets will be discarded. Click ‘No’ to deactivate the target prediction module.");
        wiz.setXClose();
        wiz.textPane.append("Do you want the results to be automatically filtered based on target specificity?");
        wiz.setYes(function(){
            wiz.filtered = true;
            cb_designSyntasiRNAFinal();
        });
        wiz.setNo(function(){
            wiz.filtered = false;
            cb_designSyntasiRNAFinal();
        });
        wiz.setBack(function(){ 
            //rebind the plus button as well
            cb_revertState(wiz); 
            wiz.filtered = undefined;
            wiz.textPane = $("#wizard-text"); //kind of a hack
            wiz.addPlusButton( ".transcript-lookup" );
            wiz.transcriptId = "";
        });
    }
    //unannotated
    function cb_designSyntasiRNA4_u(){
        var trans = "";
        wiz.textPane.find(".sequence").each(function(){
            trans += $(this).val() + ",";
        });
        trans = trans.substring(0, trans.length-1);
        if ( trans != "") {
            wiz.transcript = trans;
        }
        wiz = new Wizard(wiz);
        wiz.restoreFormFields();
        wiz.addAllYN();
        wiz.textPane.append("Do you want the results to be automatically filtered based on target specificity?");
        wiz.setYes(function(){ 
            wiz.filtered = true;
            cb_designSyntasiRNAFinal(); 
        });
        wiz.setNo(function(){
            wiz.filtered = false;
            cb_designSyntasiRNAFinal();
        });
        wiz.setBack(function(){
            cb_revertState(wiz);
            wiz.textPane = $("#wizard-text"); //still a hack
            wiz.addPlusButton( ".wizard-transcript" );
            wiz.transcript = "";
            wiz.filtered = undefined;
        });
        
    }
    
    function cb_designSyntasiRNAFinal(){
        wiz = new Wizard(wiz);
        wiz.restoreFormFields();
        wiz.addAllNB();
        wiz.textPane.append("<h5>Species: " +wiz.species+ "</h5>");
        //foreach
        if(wiz.transcriptId !== ""){
            var csv = wiz.transcriptId.split(",");
            for(var i = 0; i < csv.length; i++){
                wiz.textPane.append("<h5>Transcript ID: " +csv[i]+ "</h5>");
            }
        } else{
            wiz.textPane.append("<h5>Transcript: " + wiz.transcript);
        }
        wiz.textPane.after($(".result").outerHTML());
        $("#wizard-pane").find(".result").removeClass("result").addClass("my-result");
        wiz.setNextText("Submit");
        wiz.setNext(cb_submit);
        wiz.setBack( function(){ cb_revertState(wiz) } );
    }
    function cb_submit(){
        $('.my-result').removeClass('hidden alert alert-danger alert-success');
        $('.my-result').addClass('alert alert-warning');
        $('.my-result').html('<img src="'+ $("#gifloader").val() + '"/>' );

        $.post( $("#rnamaker_syntasirequest").val(), { transcript: wiz.transcript, transcriptId: wiz.transcriptId, species: wiz.speciesId, filtered: wiz.filtered } )
            .success(function(data){
                $('.my-result').removeClass('hidden alert alert-danger alert-warning');
                $('.my-result').addClass("alert alert-success");
                $('.my-result').text("Success!");
                $("#next").animate({
                      color: "#fff"
                }, 1000 );
                $("#next").attr("href", $("#tokensplain").val() + "/" + data );
                wiz.setNextText("Click to see Results");
                $("#next").unbind("click");
                wiz.setNext(function(){
                    window.location = $("#tokensplain").val() + "/" + data;
                });
                console.log(data); 
            })
            .error(function( xhr, statusText, err){
                $('.my-result').removeClass('hidden alert alert-success alert-warning');
                $('.my-result').addClass("alert alert-danger");
                if (xhr.responseText != ""){
                    $('.my-result').html(xhr.responseText);
                } 
            })
    }
    
    function cb_generateOligos1(){
        wiz = new Wizard(wiz);
        wiz.addAllNB();
        wiz.textPane.append("Enter or paste a syntasiRNA sequence. Click the '+' button for entering additional syntasiRNA sequences.");
        wiz.textPane.append($("#oligo-form").outerHTML());
        wiz.textPane.find("#oligo-form").addClass("oligo-form");
        wiz.addPlusButton(".oligo-form");
        wiz.wizardPane.find(".add").click(function(){ 
            $(".name").click(toInputTransform);
            $('.oligo-form').last().find(".oligo-seq").removeClass("alert alert-warning alert-danger input-warning input-danger"); 
        });
        wiz.textPane.after($(".result").outerHTML());
        $("#wizard-pane").find(".result").removeClass("result").addClass("my-result");
        $(".name").click(toInputTransform);
        $('.modal').click(function(){
            if (!$(event.target).hasClass('name')) {
                $(".modified").each(function(){
                    var val = $(this).val()
                    $(this).replaceWith("<label class='name' style='border-bottom: 1px dashed #000;text-decoration: none;'>" + val + "</label>");
                    $(".name").click(toInputTransform);

                });
            }
        });
        function toInputTransform(){
            var cur = $(this).text();
            if (cur == ""){
                var cur = $(this).val();
            }
            $(this).replaceWith("<input type='text' class='form-control name modified' value='" + cur + "' placeholder='" + cur +"'/>") ;
        } 
        wiz.setNextText("Submit");
        wiz.setNext( function() {
            var errors = oligoValidityCheck(".oligo-seq");
            if (!errors){
                cb_oligoSubmit(); 
            }
            else {
                console.log(errors);
            }
        });
        wiz.setBack( function() { $(".modal").unbind("click"); cb_revertState(wiz) });
    }
    function cb_oligoSubmit(){
        var seq = "";
        var name = "";
        var fasta = "";
        if (wiz.textPane.find(".oligo-seq").length > 0){
            wiz.textPane.find(".name").each(function(){
                name+= $(this).text() + ",";
            });
            wiz.textPane.find(".oligo-seq").each(function(){
                seq += $(this).val() + ",";
            });
            name = name.substr(0, name.length - 1);
            seq = seq.substr(0, seq.length - 1);
        } 
        else{
            fasta = wiz.textPane.find(".oligo-fasta").val();
        }
        $('.my-result').removeClass('hidden alert alert-danger alert-success');
        $('.my-result').addClass('alert alert-warning');
        $('.my-result').html('<img src="'+ $("#gifloader").val() + '"/>' );

        $.post( $("#oligodesigner").val(), { seq: seq, name: name, fasta: fasta } )
            .success(function(data){
                $('.my-result').removeClass('hidden alert alert-danger alert-warning');
                $('.my-result').addClass("alert alert-success");
                $('.my-result').text("Success!");
                $("#next").animate({
                      backgroundColor: "#7CB02C",
                      color: "#fff"
                }, 1000 );
                console.log(data);
                $("#next").attr("href", $("#oligotokensplain").val() + "/" + data );
                wiz.setNextText("Click to see Results");
                $("#next").unbind("click");
                wiz.setNext(function(){
                    window.location = $("#oligotokensplain").val() + "/" + data;
                });
            })
            .error(function( xhr, statusText, err){
                $('.my-result').removeClass('hidden alert alert-success alert-warning');
                $('.my-result').addClass("alert alert-danger");
                if (xhr.responseText != ""){
                    $('.my-result').html(xhr.responseText);
                }
            })
    }
    //Same as generateOligos1 except it uses fasta instead of line-by-line name/sequence pairs. 
    function cb_generateOligos2(){
        wiz = new Wizard(wiz);
        wiz.addAllNB();
        wiz.textPane.append("Enter or paste FASTA sequence(s) of target transcript(s)")
        wiz.textPane.append($("#oligo-fasta-form").outerHTML());
        wiz.textPane.find("#oligo-fasta-form").prepend("<label for='oligo-fasta-form'>syntasiRNA fasta</label>");
        wiz.textPane.find("#oligo-fasta-form").addClass("oligo-fasta-form");
        wiz.wizardPane.find(".add").click(function(){
            $('.oligo-fasta-form').last().find(".oligo-fasta").removeClass("alert alert-warning alert-danger input-warning input-danger");
        });
        wiz.textPane.after($(".result").outerHTML());
        $("#wizard-pane").find(".result").removeClass("result").addClass("my-result");
        wiz.setNextText("Submit");
        wiz.setNext( function() {
            var errors = oligoFastaValidityCheck(".oligo-fasta");
            //check result and continue if not false.
            if (!errors) {
                cb_oligoSubmit(); 
            } else{
                console.log(errors);
            } 
        });
        wiz.setBack( function() { cb_revertState(wiz) });
    }
    //checks the validity of each input oligo
    function oligoValidityCheck(classname){
        try{
            prevErrors = errors;
            prevWarnings = warnings;
        }catch(err){
            prevErrors = "";
            prevWarnings = "";
        }
        errors = "";
        warnings = "";
        errorsExist = true;
        wiz.textPane.find(classname).each(function(){
            var seq = $(this).val();
            result = wiz.wizardPane.find(".my-result");
            var color = "none";
            $(this).removeClass("alert alert-warning alert-danger input-warning input-danger");
            var current = result.text();
            if(seq.length != 21){
                errors += "Error: Your input sequence is not 21 NT in length<br/>";
                color = "red";
            }
            if(seq.match("^[ATCGUatcgu]+$") != seq){
                errors += "Error: Your sequence contains characters that are not A,T,C,G, or U<br/>";
                color = "red";
            }
            if (seq.substr(0,1).toUpperCase() !== "T" && seq.substr(0,1).toUpperCase() !== "U"){
                warnings += "Warning: We recommend a T or U on the 5' end. <br/>";
                color == "none" ? color = "yellow" : "";
            }
            if (seq.substr(18,1).toUpperCase() !== "C"){
                warnings += "Warning: We recommend a C at syntasiRNA position 19, in order to have a 5' G on the miR*<br/>";
                color == "none" ? color = "yellow" : "";
            }
            if (color == "red"){
                $(this).addClass("alert alert-danger input-danger");
            } else if (color == "yellow"){
               $(this).addClass("alert alert-warning input-warning");
            }
            if (errors != ""){
                result.removeClass("hidden alert-warning");
                result.addClass("alert alert-danger");
                result.html(errors + warnings);
                errorsExist = true;
            } else if (warnings != ""){
                result.removeClass("hidden alert-danger");
                errorsExist  =  true;
                result.addClass("alert alert-warning");
                if ( prevWarnings == warnings && prevErrors == ""){
                    errorsExist =  false; 
                }
                result.html(warnings);
            } else{
                result.removeClass("alert alert-danger alert-warning").addClass("hidden");
                errorsExist = false; 
            }
        });
        return errorsExist;
    }
    //checks the validity of each entry in the fasta format, also checks fasta format.
    function oligoFastaValidityCheck(classname){
        try{
            prevErrors = errors;
            prevWarnings = warnings;
        }catch(err){
            prevErrors = "";
            prevWarnings = "";
        }
        errors = "";
        warnings = "";
        errorsExist = true;
        //keep same sequence rules
        //find text box, iterate over each group of 2, first is name second is sequence.
        var fasta = wiz.textPane.find(classname).val();
        var fastaSplits = fasta.split("\n");
        if (fastaSplits.length % 2 != 0 || fastaSplits.length < 2 ){
            errors += "<strong>Error: Your input is not fasta format.</strong><br/><br/>";
        } 
    
        for (var i = 0; i < fastaSplits.length; i+=2){
            var seq = fastaSplits[i+1];
            var name = fastaSplits[i];
            wiz.textPane.find(classname).removeClass("alert alert-warning alert-danger input-warning input-danger");
            result = wiz.wizardPane.find(".my-result");
            var color = "none";
            wiz.textPane.find(classname).removeClass("alert alert-warning alert-danger input-warning input-danger");
            if(name.substr(0,1) != ">"){
                errors += "Error: One of your fasta headers does not begin with '>': " + name + "<br/>";
                color = "red";
            }
            if(seq.length != 21){
                errors += "Error: Your input sequence is not 21 NT in length: " + name + "<br/>";
                color = "red";
            }
            if(seq.match("^[ATCGUatcgu]+$") != seq){
                errors += "Error: Your sequence contains characters that are not A,T,C,G, or U: " + name + "<br/>";
                color = "red";
            }
            if (seq.substr(0,1).toUpperCase() !== "T" && seq.substr(0,1).toUpperCase() !== "U"){
                warnings += "Warning: We recommend a T or U on the 5' end: "+ name + "<br/>";
                color == "none" ? color = "yellow" : "";
            }
            if (seq.substr(18,1).toUpperCase() !== "C"){
                warnings += "Warning: We recommend a C at syntasiRNA position 19, in order to have a 5' G on the miR*: "+ name + "<br/>";
                color == "none" ? color = "yellow" : "";
            }
            if (color == "red"){
                wiz.textPane.find(classname).addClass("alert alert-danger input-danger");
            } else if (color == "yellow"){
               wiz.textPane.find(classname).addClass("alert alert-warning input-warning");
            }
            if (errors != ""){
                result.removeClass("hidden alert-warning");
                result.addClass("alert alert-danger");
                result.html(errors + warnings);
                errorsExist = true;
            } else if (warnings != ""){
                result.removeClass("hidden alert-danger");
                result.addClass("alert alert-warning");
                errorsExist =  true;
                if ( prevWarnings == warnings && prevErrors == ""){
                    errorsExist =  false;
                }
                result.html(warnings);
            } else{
                result.removeClass("alert alert-danger alert-warning").addClass("hidden");
                errorsExist = false;
            }
        }
        return errorsExist;
    }
    //initialize
    baseState();
    $("#close-clear").click(function(){
        baseState();
    });
    $(".help").click(function(){
        if($("#wizard-note").text() != ""){
            $("#wizard-note").fadeIn(1000);
        }
    });
});
