$().ready(function(){
    function baseState(){
        wiz = new Wizard();
        wiz.addAllYN();
        //add a help pane and place it there
        wiz.notePane.text("Click ‘Design an amiRNA’ if you want to identify optimal amiRNA guide sequences that target your gene(s) of interest. Click ‘Generate oligos’ if you already have an amiRNA guide sequence and you just want to generate oligos compatible with cloning in a BsaI-ccdB vector containing the Arabidopsis MIR390a foldback.");
        //if it has children you probably want to append.
        wiz.textPane.append("Do you need to design an amiRNA or do you already have a guide sequence and need to generate oligos for cloning?");
        wiz.setYesText("Design an amiRNA");
        wiz.setNoText("Generate Oligos");
        wiz.setYes(cb_designAmiRNA1);
        wiz.setNo(cb_generateOligos1);
    }
    function cb_designAmiRNA1(){
        wiz = new Wizard(wiz);
        wiz.addAllYN();
        wiz.notePane.text("Will you use your amiRNA in one of the following species?");
        wiz.textPane.append($("#species").html());
        wiz.setYes(cb_designAmiRNA2); //make sure it saves the species
        wiz.setNo(cb_generateOligos1); 
        $(wiz.yesButton).text("Yes");
        $(wiz.noButton).text("No");
        wiz.setBack(function(){
            cb_revertState(wiz);
        });
        
    }
    function cb_designAmiRNA2(){
        wiz.species = $("#database option:selected").text();
        wiz.speciesId = $("#database option:selected").val();
        wiz = new Wizard(wiz);
        wiz.restoreFormFields(); //gets species/speciesid
        wiz.addAllYN();
        //wiz.helpPane.text("Click ‘Annotated transcript(s)’ if you have gene ID(s). Click ‘Unannotated/exogenous transcript(s)’ if you want to target transcripts that do not have an assigned gene ID or are not found in the selected reference transcriptome.");
        
        wiz.textPane.text("Do you want to target annotated transcript(s) or unannotated/exogenous transcript(s)?");
        wiz.setYesText("Target annotated transcript(s)");
        wiz.setNoText("Target unannotated/exogenous transcript(s)");
        //work in progress
        //wiz.noButton.css("font-size", "16px").css("height", height);
        wiz.setYes(cb_designAmiRNA3_annotated);
        wiz.setNo(cb_designAmiRNA3_unannotated);
        wiz.setBack(function(){ cb_revertState(wiz); });
    }
    function cb_designAmiRNA3_annotated(){
        wiz = new Wizard(wiz);
        wiz.restoreFormFields(); 
        wiz.addAllNB();
        $("#sequence").val(""); //clear form?
        $("#gene").val("");
        wiz.textPane.html( $("#transcript-lookup").outerHTML() );
        wiz.textPane.find( $("#transcript-lookup").addClass("transcript-lookup") );
        wiz.addPlusButton( ".transcript-lookup" );
        wiz.setNext(cb_designAmiRNA4_a);
        wiz.setBack(function(){ cb_revertState(wiz); });
    }
    function cb_designAmiRNA3_unannotated(){
        wiz = new Wizard(wiz);
        wiz.restoreFormFields();
        wiz.addAllNB();
        $("#sequence").val("");
        $("#gene").val("");
        wiz.textPane.html( $("#wizard-transcript").outerHTML() );
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
            cb_designAmiRNA4_u();
        }); 
        wiz.setBack(function() { cb_revertState(wiz); });
    }
    //annotated
    function cb_designAmiRNA4_a(){
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
        wiz.textPane.text("Do you want the results to be automatically filtered based on target specificity?");
        wiz.setYes(function(){
            wiz.filtered = true;
            cb_designAmiRNAFinal();
        });
        wiz.setNo(function(){
            wiz.filtered = false;
            cb_designAmiRNAFinal();
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
    function cb_designAmiRNA4_u(){
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
        wiz.textPane.text("Do you want the results to be automatically filtered based on target specificity?");
        wiz.setYes(function(){ 
            wiz.filtered = true;
            cb_designAmiRNAFinal(); 
        });
        wiz.setNo(function(){
            wiz.filtered = false;
            cb_designAmiRNAFinal();
        });
        wiz.setBack(function(){
            cb_revertState(wiz);
            wiz.textPane = $("#wizard-text"); //still a hack
            wiz.addPlusButton( ".wizard-transcript" );
            wiz.transcript = "";
            wiz.filtered = undefined;
        });
        
    }
    
    function cb_designAmiRNAFinal(){
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

        $.post( $("#rnamaker_amirnarequest").val(), { transcript: wiz.transcript, transcriptId: wiz.transcriptId, species: wiz.speciesId, filtered: wiz.filtered } )
            .success(function(data){
                $('.my-result').removeClass('hidden alert alert-danger alert-warning');
                $('.my-result').addClass("alert alert-success");
                $('.my-result').text("Success!");
                $("#next").animate({
                      backgroundColor: "#7CB02C",
                      color: "#fff"
                }, 1000 );
                $("#next").attr("href", $("#tokensplain").val() + "/" + data );
                wiz.setNextText("Click to see Results");
                $("#next").unbind("click");
                wiz.setNext(function(){
                    window.location = $("#tokensplain").val() + "/" + data;
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
    
    function cb_generateOligos1(){
        wiz = new Wizard(wiz);
        wiz.addAllNB();
        wiz.textPane.append("<h4>amiRNA sequence, click to edit name</h4>");
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
        wiz.setNext( function() {
            var result = oligoValidityCheck(".oligo-seq");
            console.log("submit");
        });
        wiz.setBack( function() { $(".modal").unbind("click"); cb_revertState(wiz) });
    }
    function oligoNameEditBinding(){

    }
    //each amirna represents one oligo to construct ?
    function oligoValidityCheck(classname){
        errors = "";
        warnings = "";
        result = true;
        wiz.textPane.find(classname).each(function(){
            var seq = $(this).val();
            result = wiz.wizardPane.find(".my-result");
            var color = "none";
            console.log($(this).outerHTML());
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
                warnings += "Warning: We recommend a C at amiRNA position 19, in order to have a 5' G on the miR*<br/>";
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
                result = true;
            } else if (warnings != ""){
                result.removeClass("hidden");
                if (! result.hasClass("alert-danger")){
                    result.addClass("alert alert-warning");
                }
                result.html(warnings);
                result =  true;
            } else{
                result.removeClass("alert alert-danger alert-warning").addClass("hidden");
            }
            result = false; 
        });
        return result;
    }
    //initialize
    baseState();

});
