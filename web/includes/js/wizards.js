/**
 * Wizards.js
 *
 * This script handles the entire wizard, resetting anytime back or clear is clicked.
 * On click you should create a new wizard with the previous wizard as the previous state. A new wizard
 * will clear out all of the forms and allow you to construct it as you wish. If the user presses back, you should
 * revert to the previous state. (revertState)
 *
 * @author Steven Hill
 * @updated 2013-12-22
 */
function Wizard(previousState){
    //also contains transcript, species, and speciesId, should be set by user.
    if (previousState == "" || previousState == undefined){
        this.previousState = undefined; //set this somewhere
    } else{
        previousState.saveFields();
        this.previousState = previousState;
    }
    //dom elements
    this.yesButton = $("#yes-orig").outerHTML();
    this.yesButton =  $(this.yesButton).attr("id", "yes").outerHTML();
    this.noButton = $("#no-orig").outerHTML();
    this.noButton = $(this.noButton).attr("id", "no").outerHTML();
    this.nextButton = $("#next-orig").outerHTML();
    this.nextButton = $(this.nextButton).attr("id", "next").outerHTML();
    this.backButton = $("#back-orig").outerHTML();
    this.backButton = $(this.backButton).attr("id", "back").outerHTML();
    this.notePane = $("#wizard-note").text("");
    this.textPane = $("#wizard-text").text(""); //clear, no children.
    this.wizardPane = $("#wizard-pane").text(""); //dont clear because it has children
    //click callbacks
    this.yesClick = undefined;
    this.noClick = undefined;
    this.nextClick = undefined;
    this.backClick = undefined;
    //useful variables
    this.species = "None";
    this.speciesId = null;
    this.transcript = "";
    this.transcriptId = "";
    this.filtered = undefined;
    //update function
    this.updateFields = function(){
        this.yesButton = $("#yes").outerHTML();
        this.noButton = $("#no").outerHTML();
        this.nextButton = $("#next").outerHTML();
        this.backButton = $("#back").outerHTML();
        this.notePane = $("#wizard-note");
        this.textPane = $("#wizard-text"); //clear, no children.
        this.wizardPane = $("#wizard-pane"); //dont clear because it has children
        return this;
    }
    //same as previous except it saves html instead of selectors (useless)
    this.saveFields = function(){
        this.yesButton = $("#yes").outerHTML();
        this.noButton = $("#no").outerHTML();
        this.nextButton = $("#next").outerHTML();
        this.backButton = $("#back").outerHTML();
        this.notePane = $("#wizard-note").clone();
        this.textPane = $("#wizard-text").clone(); //clear, no children.
        this.wizardPane = $("#wizard-pane").clone(); //dont clear because it has children
        return this;
    }
    this.restoreButtons = function(){
        this.nextButton = previousState.nextButton;
        this.backButton = previousState.backButton;
        this.yesButton = previousState.yesButton;
        this.noButton = previousState.noButton;
    }
    this.restoreFormFields = function(){
        this.species = previousState.species;
        this.speciesId = previousState.speciesId;
        this.transcript = previousState.transcript;
        this.transcriptId = previousState.transcriptId;
        this.filtered = previousState.filtered;
        return this;
    }
    //reverts a passed wizard to it's former state. This is a callback that should be used on these statements,
    // calling it from the object itself would break everything (click handlers, this scoping).
    // wizard is a mutable object.
    cb_revertState = function(wizard){
        previousState = wizard.previousState;
        $("#wizard-pane").html(previousState.wizardPane)
        wizard.textPane = previousState.textPane;
        wizard.wizardPane = previousState.wizardPane;
        wizard.species = previousState.species;
        wizard.speciesId = previousState.speciesId;
        wizard.transcript = previousState.transcript;
        wizard.transcriptId = previousState.transcriptId;
        wizard.previousState = previousState.previousState; //yolo
        //updating buttons is a 2 step process, you need to copy the new html and apply it to a new selector
        if (previousState.yesClick != undefined){
            $("#yes").text($(previousState.yesButton).text());
            wizard.yesClick = previousState.yesClick;
            $("#no").text($(previousState.noButton).text());
            wizard.noClick = previousState.noClick;
            //assign handlers
            wizard.setYes(wizard.yesClick);
            wizard.setNo(wizard.noClick);
        }
        if(previousState.nextClick != undefined){
            $(wizard.nextButton).text($(previousState.nextButton).text());
            wizard.nextClick = previousState.nextClick;
            wizard.setNext(wizard.nextClick);
        }
        //always saved    
        $(wizard.backButton).text($(previousState.backButton).text());
        wizard.setBack(previousState.backClick);
        return wizard;
    }
    //place first
    this.addYesButton = function(){
        this.textPane.after(this.yesButton);
        return this;
    }
    //place second
    this.addNoButton = function(){
        $("#yes").after(this.noButton);
        return this;
    }
    //place after top button
    this.addBackButton = function(){
        this.textPane.after(this.backButton);
        return this;
    }
    //place after notepane
    this.addTextPane = function(){
        this.wizardPane.append(this.textPane);
        return this;
    }
    //place after textpane
    this.addNextButton = function(){
        this.textPane.after(this.nextButton);
        return this;
    }
    //does nothing
    this.addWizardPane = function(){
        return this;
    }
    //first thing in wizard pane
    this.addNotePane = function(){
        //should come before wiz pane probably
        this.textPane.append(this.notePane);
        return this;
    }
    this.addAllYN = function(){
        this.addTextPane().addNotePane().addBackButton().addYesButton().addNoButton();
        return this;
    } 
    this.addAllNB = function(){
        this.addTextPane().addNotePane().addBackButton().addNextButton();
        return this;
    }
    // setNText set of functions are wrappers for calling the selectors.
    this.setYesText = function(text){
        $("#yes").text($(this.yesButton).text(text).text());
    }
    this.setNoText = function(text){
        $("#no").text($(this.noButton).text(text).text());
    }
    this.setNextText = function(text){
        $("#next").text($(this.nextButton).text(text).text());
    }
    this.setBackText = function(text){
        $("#back").text($(this.backButton).text(text).text());
    }

    this.setYes = function(cb_yes){
        if (cb_yes != undefined){
            this.yesClick = cb_yes;
            $("#yes").unbind("click");
            $("#yes").click(cb_yes);
        } else if(this.yesClick != undefined){
            $("#yes").unbind("click");
            $("#yes").click(this.yesClick);
        }
        return this;
    }
    this.setNo = function(cb_no){
        this.noClick = cb_no;
        $("#no").unbind("click");
        $("#no").click(cb_no);
        return this;
    }
    this.setNext = function(cb_next){
        this.nextClick = cb_next;
        $("#next").unbind("click");
        $("#next").click(cb_next);
        return this;
    }
    //argument should almost always be revertState
    this.setBack = function(cb_back){
        this.backClick = cb_back
        $("#back").unbind("click");
        $("#back").click(cb_back);
        return this;
    }
    //expects a class unique to the clonal field.
    this.addPlusButton = function( clonalField ){
        if ( this.textPane.find(".add").length <= 0){
            $(clonalField).last().after( $(".add").outerHTML() );
        }
        this.textPane.find(".add").click(function(){
            $(clonalField).last().after( $(clonalField).outerHTML() );
            //will not affect anything other than the specific form it's targetting
            $(clonalField).last().find(".oligo-seq").removeClass("alert alert-warning alert-danger input-warning input-danger");
        });
    }
    this.resetState = function(){
        this.saveFields();
        return new Wizard(this);    
    }
}
//outer html function
jQuery.fn.outerHTML = function() {
  return jQuery('<div />').append(this.eq(0).clone()).html();
};
