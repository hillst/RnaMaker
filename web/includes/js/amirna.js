$().ready(function(){
    n = 1;
    var ignore = false;
    
    function baseState(){
        wiz = new Wizard();
        wiz.addAllYN();
       
        wiz.notePane.text("Click ‘Design an amiRNA’ if you want to identify optimal amiRNA guide sequences that target your gene(s) of interest. Click ‘Generate oligos’ if you already have an amiRNA guide sequence and you just want to generate oligos compatible with cloning in a BsaI-ccdB vector containing the Arabidopsis MIR390a foldback.");
        //if it has children you probably want to append.
        wiz.textPane.append("Do you need to design an amiRNA or do you already have a guide sequence and need to generate oligos for cloning?");
        wiz.yesButton.text("Design an amiRNA");
        wiz.noButton.text("Generate Oligos");
        wiz.setYes(cb_designAmiRNA1);
        wiz.setNo(cb_generateOligos1);
    }
    function cb_designAmiRNA1(){
        console.log("designAmiRNA1");
        wiz1 = wiz;
        console.log(wiz1);
        wiz = new Wizard(wiz);
        wiz.addAllYN();
        wiz.notePane.text("Will you use your amiRNA in one of the following species?");
        wiz.textPane.text($("#species").html());
        wiz.setYes(cb_designAmiRNA2);
        wiz.setNo(cb_generateOligos1()); 
        wiz.setBack(function(){
            cb_revertState(wiz);
        });
        
    }
    function cb_designAmiRNA2(){
        console.log("designAmiRNA2");
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
        console.log("bound submit bound click to submit");
        $("#oligoresult").click(function(){
            $("#wizard-pane").find(".oligodesigner").submit();
        });
    }
});
