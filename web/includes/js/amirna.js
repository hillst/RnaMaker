/**
 * This script handles the entire wizard, resetting anytime back or clear is clicked.
 */
$().ready(function(){
    var startState = $("#wizard-pane").html();
    species = "None";
    speciesId = null;
    transcript = false;
    transcriptId = false;
    var ignore = false;
    $("#close-clear").click(cb_resetState);
    $("#no").click(cb_amiNo);
    $("#yes").click(cb_targetfinderForm);
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
                $( "#result" ).animate({
                      backgroundColor: "#7CB02C",
                      color: "#fff"
                }, 1000 );
                $("#result").attr("href", $("#tokensplain").val() + "/" + data );
                $("#result").text("Click to see Results");
                $("#result").unbind("click");
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
    //wizard question callbacks
    //  amiRNA sequence? 
    //  yes                                 no
    //  Oligo                            select database
    //                                      Do you have transcript id
    //                                      yes                     no
    //                               Select Transcript by id    input transcript (target?)
    //                                                  Final Form
    //select species
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
    //    $(".filterinput").fastLiveFilter("#transids li"); 
        
        //cleanup from other inputs
        $("#sequence").val("");
        $("#gene").val("");
        $("#wizard-text").html( $("#transcript-lookup").html() );
        $("#no").text("Back").unbind("click").click(cb_postSpecies);
        $("#yes").text("Next").unbind("click").click(cb_submissionForm);
    }
    //show searchable list
    function cb_idNo(){
    
        //cleanup from other inputs
        $("#sequence").val("");
        $("#gene").val("");
        $("#wizard-text").html( $("#wizard-transcript").html() );
        $("#no").text("Back").unbind("click").click(cb_postSpecies);
        $("#yes").text("Next").unbind("click").click(cb_submissionForm);
    }
    //go to original state
    function cb_resetState(){
        species = "none";
        $("#wizard-species").text("Species: None");
        $("#wizard-pane").html(startState);
        $("#no").text("No").unbind("click").click(cb_amiNo);
        $("#yes").text("Yes").unbind("click").click(cb_targetfinderForm);
        $("#reset").unbind("click");
        $(".targetfinder").unbind("submit");
        $(".result").removeClass("alert alert-danger alert-warning");
        $(".result").addClass("hidden");
    }
    //builds summary
    function cb_submissionForm(){
        //one will hit
        transcript = $("#sequence").val();
        transcriptId = $("#gene").val();
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
        $("#label-species").text(species);
        $("#wizard-pane").html( $("#wizard-submissionform").html() );
        $("#startover").click(cb_resetState);
        $(".targetfinder").last().submit(submitAmirnaDesigner);
        $("#result").click(function(){
            $(".designer").last().submit();
        });
    }
    function cb_targetfinderForm(){
        $("#wizard-pane").html( $("#targetfinder-submission").html() );
        $(".startover").click(cb_resetState);
        $(".targetfinder").last().submit(function(event){ event.preventDefault();console.log("submitted");});
        console.log("bound submit bound click to submit");
        $("#targetresult").click(function(){
            $(".targetfinder").last().submit();
        });
    }
});