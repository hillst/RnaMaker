/**
 * Wizards.js
 *
 * This script handles the entire wizard, resetting anytime back or clear is clicked.
 * On click you should create a new wizard with the previous wizard as the previous state. A new wizard
 * will clear out all of the forms and allow you to construct it as you wish. If the user presses back, you should
 * revert to the previous state. (revertState)
 *
 * @author Steven Hill
 * @updated 2013-12-13
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
    this.yesButton = $("#yes");
    this.noButton = $("#no");
    this.nextButton = $("#next");
    this.backButton = $("#back");
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
    this.transcript = false;
    this.transcriptId = false;
    //update function
    this.updateFields = function(){
        this.yesButton = $("#yes");
        this.noButton = $("#no");
        this.nextButton = $("#next");
        this.backButton = $("#back");
        this.notePane = $("#wizard-note");
        this.textPane = $("#wizard-text"); //clear, no children.
        this.wizardPane = $("#wizard-pane"); //dont clear because it has children
        return this;
    }
    //same as previous except it saves html instead of selectors (useless)
    this.saveFields = function(){
        this.yesButton = $("#yes").clone();
        this.noButton = $("#no").clone();
        this.nextButton = $("#next").clone();
        this.backButton = $("#back").clone();
        this.notePane = $("#wizard-note").clone();
        this.textPane = $("#wizard-text").clone(); //clear, no children.
        this.wizardPane = $("#wizard-pane").clone(); //dont clear because it has children
        return this;
    }
    //reverts a passed wizard to it's former state. This is a callback that should be used on these statements,
    // calling it from the object itself would break everything (click handlers, this scoping).
    // wizard is a mutable object.
    cb_revertState = function(wizard){
        previousState = wizard.previousState;
        $("#wizard-pane").html(previousState.wizardPane)
        //wizard.notePane = $(previousState.notePane);
        wizard.textPane = previousState.textPane;
        wizard.wizardPane = previousState.wizardPane;
        wizard.species = previousState.species;
        wizard.speciesId = previousState.speciesId;
        wizard.transcript = previousState.transcript;
        wizard.transcriptId = previousState.transcriptId;
        wizard.previousState = previousState.previousState; //yolo
        //updating buttons is a 2 step process, you need to copy the new html and apply it to a new selector
        if (wizard.yesClick != undefined){
            wizard.yesButton = $("#yes");
            wizard.yesButton.text(previousState.yesButton.text());
            wizard.yesClick = previousState.yesClick;
            wizard.noButton = $("#no");
            wizard.noButton.text(previousState.noButton.text());
            wizard.noClick = previousState.noClick;
            //assign handlers
            wizard.setYes(wizard.yesClick);
            wizard.setNo(wizard.noClick);
        }
        if(wizard.nextClick != undefined){
            wizard.nextButton = $("#next");
            wizard.nextButton.text(previousState.nextButton.text());
            wizard.setNext(wizard.nextClick);
        }
        wizard.backButton = $("#back");
        wizard.backButton.text(previousState.backButton.text());
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
        this.yesButton.after(this.noButton);
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
        //should already be there...
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
    this.setYes = function(cb_yes){
        if (cb_yes != undefined){
            this.yesClick = cb_yes;
            this.yesButton.unbind("click");
            this.yesButton.click(cb_yes);
        } else if(this.yesClick != undefined){
            this.yesButton.unbind("click");
            this.yesButton.click(this.yesClick);
        }
        return this;
    }
    this.setNo = function(cb_no){
        this.noClick = cb_no;
        this.noButton.unbind("click");
        this.noButton.click(cb_no);
        return this;
    }
    this.setNext = function(cb_next){
        this.nextClick = cb_next;
        this.nextButton.unbind("click");
        this.nextButton.click(cb_next);
        return this;
    }
    //argument should almost always be revertState
    this.setBack = function(cb_back){
        this.backClick = cb_back
        this.backButton.unbind("click");
        this.backButton.click(cb_back);
        return this;
    }
    //selector clonalField
    this.addPlusButton = function( clonalField ){
        clonalField.after( $(".add").html() );
        clonalField.find(".add").click(function(){
            clonalField.after( clonalField );
        })
    }
    this.resetState = function(){
        this.saveFields();
        return new Wizard(this);    
    }
}
