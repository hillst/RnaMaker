$().ready(function(){
    changed = true;
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
function cb_submitOligo(event){
    //changed is a variable
    if (changed && checkErrors(this)){
        event.preventDefault();
        if ($('.result').hasClass("alert-warning")){
            changed = false;
        }
        return;
    }
    //for somer reason we need to be "first"
    form = $(this);
    var url = $("#oligourl").val();
    var token = $("#oligotoken").val();
    var finseq = $(this).serialize();
    name = $(".name").first().text();
    if (name == ""){
        name = $(".name").val();
    }
    finseq += "&name=" + name;
    $.ajax({
        type: "POST",
        url: url,
        data: finseq,
        success: function(data){
            form.find('.result').removeClass('hidden alert alert-danger alert-warning');
            form.find('.result').addClass("alert alert-success");
            form.find('.result').text("Success!");
            $( "#result" ).animate({
                  backgroundColor: "#7CB02C", //btn secondary
                  color: "#fff"
            }, 1000 );
            $("#oligoresult").attr("href", token +"/" + data );
            $("#oligoresult").text("Click to see Results");
            $("#oligoresult").unbind("click");
        },
        error: function(xhr, status, error) {
            form.find('.result').removeClass('hidden alert alert-success alert-warning');
            form.parent().find('.result').addClass("alert alert-danger");
            if (xhr.responseText != ""){
                form.parent().find('.result').text(xhr.responseText);
            } else{
                if(!ignore){
                    form.parent().find('.result').text("Error");
                }
            }
        },
        beforeSend: function(){
            form.find('.result').removeClass('hidden alert alert-danger alert-success');
            form.find('.result').addClass('alert alert-warning');
            form.find('.result').html('<img src="'+ $("#gifloader").val() +'"/>' );
        }
    });
    return false;
}
function checkErrors(form){
    form = $(form);
    var seq = $("#oligo-seq").val();
    result = $(".result");
    result.text("");
    result.addClass("hidden");
    result.removeClass("alert alert-danger alert-warning");
    $("#oligo-seq").removeClass("alert alert-danger alert-warning input-danger input-warning");
    var errors = "";
    var warnings = "";
    if(seq.length != 21){
        errors += "Error: Your input sequence is not 21 NT in length<br/>";
    }
    if(seq.match("^[ATCGUatcgu]+$") != seq){
        errors += "Error: Your sequence contains characters that are not A,T,C,G, or U<br/>";
    }
    if (seq.substr(0,1).toUpperCase() !== "T" && seq.substr(0,1).toUpperCase() !== "U"){
        warnings += "Warning: We recommend a T or U on the 5' end.<br/>";
    }
    if (seq.substr(18,1).toUpperCase() !== "C"){
        warnings += "Warning: We recommend a C at amiR position 19, in order to have a 5' G on the miR*<br/>";
    }
    if (errors != ""){
        $("#oligo-seq").addClass("alert alert-danger input-danger");
        result.removeClass("hidden");
        result.addClass("alert alert-danger");
        result.append(errors);
        result.append(warnings);
        return true;
    } else if (warnings != ""){
        $("#oligo-seq").addClass("alert alert-warning input-warning");
        result.removeClass("hidden");
        result.addClass("alert alert-warning");
        result.append(warnings);
        return true;
    }
    return false;
}
