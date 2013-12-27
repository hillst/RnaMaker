$().ready(function(){
    n = 1;
    var ignore = false;
    
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
        wiz.setNo(cb_generateOligos1()); 
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
        wiz.addPlusButton( ".wizard-transcript" );
        wiz.setNext(cb_designAmiRNA4_u); 
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
        if(wiz.transcriptId !== false){
            var csv = wiz.transcriptId.split(",");
            for(var i = 0; i < csv.length; i++){
                wiz.textPane.append("<h5>Transcript ID: " +csv[i]+ "</h5>");
            }
        } else{
            var csv = wiz.transcript.split(",");
            for(var i = 0; i < csv.length; i++){
                wiz.textPane.append("<h5>Transcript: " +csv[i]+ "</h5>");
            }
        }
        wiz.setNextText("Submit");
        wiz.setNext(cb_submit);
        wiz.setBack( function(){ cb_revertState(wiz) } );
    }
    function cb_submit(){
        example = "name=syntasiRNA+Cassette&seq=TCAAAAATCAAAAATCAATAA&seq=TCAAAAATCAAAAATCAATAA&fb=syntasi&name=syntasiRNA+Cassette&seq=&fb=syntasi";
        console.log("submit!!!");
        $.post( $("#rnamaker_amirnarequest").val(), { transcript: wiz.transcript, transcriptId: wiz.transcriptId, species: wiz.speciesId, filtered: wiz.filtered } )
                .success(function(data){
                    console.log(data);
                })
                .error(function( xhr, statusText, err){
                    console.log(statusText);
                    console.log(xhr.responseText);
                })
                .always(function(data){
                    console.log("done!");
                }) 
    }
    
    function cb_generateOligos1(){
        console.log("generate oligos");
    }
    //initialize
    baseState();
    console.log('BASE STATE');

    function submitAmirnaDesigner(event){
         var form = $(this);
         event.preventDefault();
         $.ajax({
            type: "POST",
            url: $("#rnamaker_amirnarequest").val(),
            data: $(this).serialize(),
            success: function(data){
                $('.result').removeClass('hidden alert alert-danger alert-warning');
                $('.result').addClass("alert alert-success");
                $('.result').text("Success!");
                $( "#designerresult" ).animate({
                      backgroundColor: "#7CB02C",
                      color: "#fff"
                }, 1000 );
                $("#designerresult").attr("href", $("#tokensplain").val() + "/" + data );
                $("#designerresult").text("Click to see Results");
                $("#designerresult").unbind("click");
            },
            error: function(xhr, status, error) {
                $('.result').removeClass('hidden alert alert-success alert-warning');
                $('.result').addClass("alert alert-danger");
                if (xhr.responseText != ""){
                    $('.result').html(xhr.responseText);
                } else{
                    if(!ignore){
                        $('.result').html("Error");
                    }
                }
            },
            beforeSend: function(){
                $('.result').removeClass('hidden alert alert-danger alert-success');
                $('.result').addClass('alert alert-warning');
                $('.result').html('<img src="'+ $("#gifloader").val() + '"/>' );
            }
        });
    }
    function cb_amiNo(){
        $("#wizard-text").html( $("#species").html() );
        $("#no").text("Back").unbind("click").click(cb_resetState);
        $("#yes").text("Next").unbind("click").click(cb_postSpecies);
    }
    //ask if they have transcript id
    function cb_postSpecies(){
        speciesId = $("#database option:selected").val();
        species = $("#database option:selected").text();
        $("#wizard-species").text("Species: "  + species);
        $("#wizard-text").html( $("#wizard-no").html() );
        $("#yes").text("Yes").unbind("click").click(cb_idYes);
        $("#no").text("No").unbind("click").click(cb_idNo);
        
    }
    //display id entry form
    function cb_idYes(){
        //cleanup from other inputs
        $("#sequence").val("");
        $("#gene").val("");
        $("#wizard-text").html( $("#transcript-lookup").html() );
        $("#no").text("Back").unbind("click").click(cb_postSpecies);
        $("#yes").text("Next").unbind("click").click(cb_submissionForm);
        $("#addgeneid").click(cb_addGeneId);
    }
    function cb_addGeneId(){
        $("#wizard-pane").find(".gene").last().after(
            "<label for='gene'>Gene:</label>" +
            "<input type='text' class='form-control gene'  placeholder='AT1G01040.1' name='gene'>"
        );
    }
    //seqid plus button
    function cb_addSequence(){
        //first i guess
        $("#wizard-pane").find(".sequence").last().after(
            "<label for='sequence'>Target sequence:</label>" +
            "<input type='text' class='form-control sequence inside' placeholder='sequence' name='seq'>"
        );
    }
    //show searchable list
    function cb_idNo(){
        //cleanup from other inputs
        $("#sequence").val("");
        $("#gene").val("");
        $("#wizard-text").html( $("#wizard-transcript").html() );
        $("#no").text("Back").unbind("click").click(cb_postSpecies);
        $("#yes").text("Next").unbind("click").click(cb_submissionForm);
        $(".addseq").click(cb_addSequence);
    }

    //go to original state
    function cb_resetState(){
        species = "none";
        $("#wizard-species").text("");
        $("#wizard-pane").html(startState);
        $("#no").text("No").unbind("click").click(cb_amiNo);
        $("#yes").text("Yes").unbind("click").click(cb_oligodesignerForm);
        $("#reset").unbind("click");
        $(".oligodesigner").unbind("submit");
        $(".designer").unbind("submit");
        $(".result").removeClass("alert alert-danger alert-warning");
        $(".result").addClass("hidden");
        $(".name").unbind("click");
        $(".modal").unbind("click");
    }
    //builds summary
    function cb_submissionForm(){
        //one will hit
        transcript = "";
        $(".sequence").each(function(){
            if ($(this).val() != ""){
                transcript += $(this).val() + ",";
            }
        });
        transcript = transcript.substr(0,transcript.length-1);
        transcriptId = "";
        $(".gene").each(function(){
            if ($(this).val() != ""){
                transcriptId += $(this).val() + ","
            }
        });
        transcriptId = transcriptId.substr(0, transcriptId.length-1);
        //add correct hit as hidden element
        $("#sub-database").val(speciesId);
        $("#sub-sequence").val(transcript);
        $("#sub-gene").val(transcriptId);
        //build labels
        if ( transcript == "" ){
            $(".label-sequence").addClass("hidden");
            $(".label-gene").removeClass("hidden");
            $("#label-gene").text(transcriptId);
        } else{
            $(".label-gene").addClass("hidden");
            $(".label-sequence").removeClass("hidden");
            $("#label-sequence").text(transcript); 
        }
        $("#label-species").text("Species: " + species);
        $("#wizard-pane").html( $("#wizard-submissionform").html() );
        $("#startover").click(cb_resetState);
        $("#wizard-pane").find(".designer").submit(submitAmirnaDesigner);
        $("#designerresult").click(function(){
            $("#wizard-pane").find(".designer").submit();
        });
    }
    function cb_oligodesignerForm(){
        $("#wizard-pane").html( $("#oligodesigner-submission").html() );
        $(".name").click(cb_toInputTransform);
        $(".modal").click(cb_revertInput);
        $(".startover").click(cb_resetState);
        $("#seq").change(cb_onFormChange);
        $("#wizard-pane").find(".oligodesigner").submit(cb_submitOligo);
        $("#oligoresult").click(function(){
            $("#wizard-pane").find(".oligodesigner").submit();
        });
    }
});
