$().ready(function(){
    changed = true;
    n = 2;
});
function cb_toInputTransform(){
        var cur = $(this).text();
        if (cur == ""){
            var cur = $(this).val();
        }
        $(this).replaceWith("<input type='text' class='form-control name modified' value='" + cur + "' placeholder='" + cur +"'/>") ;
}
function cb_revertInput(){
    if (!$(event.target).hasClass('name')) {
        $(".modified").each(function(){
            var val = $(this).val();
            $(this).replaceWith("<label class='name' style='border-bottom: 1px dashed #000;text-decoration: none;'>" + val + "</label>");
            $(".name").click(cb_toInputTransform);
        });
    }
}
function cb_onFormChange(){
    changed = true;
} 
$(".seq").change(function(){
        changed = true;
});
function cb_addSeq(){
        $("#wizard-pane").find(".seq").last().after(
            "<label class='name' style='border-bottom: 1px dashed #000;text-decoration: none;'>syntasiR-"+n+"</label>" +
            "<input type='text' class='form-control seq' placeholder='seq' name='seq'>"
        );
        $(".result").append("<div id='seq-"+n+"'></div>");
        n++;
        $(".name").click(cb_toInputTransform); //rebind
        $(".seq").change(function(){ //rebind
            changed = true;
        });
};
    
function cb_submitOligo(event){
    error = false;
    warnings = "";
    errors = "";
    first = true;
    $(".seq").each(function(i){
        error = checkErrors(this, warnings, errors, first, i) || error;
        first = false;
    });
    if (changed && error){
        event.preventDefault();
        //if just warnings reset changed
        if ($('.result').hasClass("alert-warning")){
            changed = false;
        }
        return;
    }
    var form = $(this);
    //prepare sequence for server
    var data = form.serialize();
    var seqs = data.split("&"); //first/last are not seq
    var finseq = "";
    var placed = false;
    for(var i = 0; i < seqs.length; i++){
        if (seqs[i].split("=")[0] !== "seq"){
            if(placed === true){
                finseq = finseq.substring(0, finseq.length-1);
                finseq += "&" + seqs[i];
            }else{
                finseq += seqs[i] + "&";
            }
        }
        else{
            if (placed === false){
                finseq += "seq=";
                placed = true;
            }
            finseq += seqs[i].split("=")[1] +",";
        }
    }
    //prepare syntasis
    var syntasis = "";
    $(".name").each(function(){
        if($(this).text() == ""){
            syntasis += $(this).val() + ",";
        } else{
            syntasis += $(this).text() + ",";
        }
    });
    syntasis = syntasis.substring(0, syntasis.length-1); 
    finseq += "&syntasis=" + syntasis;
    //submit ajax
    $.ajax({
        type: "POST",
        url: '{{ path("rnamaker_syntasi_oligorequest") }}',
        data: finseq,
        //should return a token that will access the results, as stored in memory
        success: function(data){
            form.find('.result').removeClass('hidden alert alert-danger alert-warning');
            form.find('.result').addClass("alert alert-success");
            form.find('.result').text("Success!");
            $( "#oligoresult" ).animate({
                  backgroundColor: "#7CB02C", //btn secondary
                  color: "#fff"
            }, 1000 );
            $("#oligoresult").attr("href", $("oligotoken").val() +"/" + data );
            $("#oligoresult").text("Click to see Results");
            $("#oligoresult").unbind("click");
        },
        error: function(xhr, status, error) {
            form.find('.result').removeClass('hidden alert alert-success alert-warning');
            form.parent().find('.result').addClass("alert alert-danger");
            if (xhr.responseText != ""){
                
                form.parent().find('.result').text(xhr.responseText);
            } else{
                form.parent().find('.result').text("Error");
            }
        },
        beforeSend: function(){
            form.find('.result').removeClass('hidden alert alert-danger alert-success');
            form.find('.result').addClass('alert alert-warning');
            form.find('.result').html('<img src="'+ $("#gifloader").val() +'"/>' );
        }
    });
}       

function checkErrors(seqbox, errors, warnings, setup, i){    
    var seq = $(seqbox).val();
    result = $(".result");
    var color = "none";
    $(seqbox).removeClass("alert alert-warning alert-danger input-warning input-danger");
    if (setup){
        result.addClass("hidden");
        result.removeClass("alert alert-danger alert-warning");
    }
    $("#seq-"+(i+1)).text("");
    var current = result.text();
    //potentially problematic, could look for substrings of each error
    if(seq.length != 21){
        errors += "Error: Your input sequence is not 21 NT in length (sequence " + (i + 1) + ")<br/>";
        color = "red";
    }
    if(seq.match("^[ATCGUatcgu]+$") != seq){
        errors += "Error: Your sequence contains characters that are not A,T,C,G, or U (sequence " + (i + 1) + ")<br/>";
        color = "red";
    }
    if (seq.substr(0,1).toUpperCase() !== "T" && seq.substr(0,1).toUpperCase() !== "U"){
        warnings += "Warning: We recommend a T or U on the 5' end. (sequence " + (i + 1) + ")<br/>";
        color == "none" ? color = "yellow" : "";
    }
    if (seq.substr(18,1).toUpperCase() !== "C"){
        warnings += "Warning: We recommend a C at syntasiR position 19, in order to have a 5' G on the miR* (sequence " + (i + 1) + ")<br/>";
        color == "none" ? color = "yellow" : "";
    }
    if (color == "red"){
        $(seqbox).addClass("alert alert-danger input-danger");
    } else if (color == "yellow"){
        $(seqbox).addClass("alert alert-warning input-warning");
    }
    if (errors != ""){
        result.removeClass("hidden alert-warning");
        result.addClass("alert alert-danger");
        $("#seq-"+(i+1)).html(errors + warnings);
        return true;
    } else if (warnings != ""){
        result.removeClass("hidden");
        if (! result.hasClass("alert-danger")){
            result.addClass("alert alert-warning");
    }
        $("#seq-"+(i+1)).html(warnings);
        return true;
    }
    return false;
}
