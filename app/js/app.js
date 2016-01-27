/**
 * Wikipedia Random Browser v1.0.0
 * By Sander Laarhoven
 * https://github.com/lesander/wikibrowser
 * MIT Licensed (c) 2016
 */


/* Include modules. */
var gui = require('nw.gui');
NwWin = gui.Window;
gui.Window.get().showDevTools();
Game = {};

/* Start game on click.  */
$("#game-start").on("click", GameStart);

/* Resize iframe height on window height change. */


function GameStart() {

  // Hide introduction section.
  $("section#intro").hide();
  $("section#game").show();

  // Set game instance object.
  Game.Instance = {
    Clicks: "none",
    Data: {
      Title: null,
      Page: null
    },
    StartPage: {
      Title: null,
      Page: null
    },
    PreviousPage: null,
    TargetPage: null,
    History: []
  };

  // Ask for target page.
  Game.Instance.TargetPage = prompt("Enter full Wikipedia target URL:");
  if (Game.Instance.TargetPage == null) {
    return GameStop();
  }
  if (Game.Instance.TargetPage.indexOf("wikipedia.org/wiki/") === -1) {
    return GameStart();
  }

  // Load random page!
  WikiPage = NwWin.open("https://en.wikipedia.org/wiki/Special:Random", {
    title: "Wikipedia Random Browser Game",
    toolbar: false,
    focus: true
  });

  // Set statistics.
  Game.Instance.Clicks = "none";

  // Gets called on every page change.
  WikiPage.on("loaded", GameReady);

}

function GameReady() {

  // First page?
  if (Game.Instance.Clicks === "none") {
    // Set start page.
    Game.Instance.StartPage = WikiPage.window.location.href;
    // Set to zero.
    Game.Instance.Clicks = 0;
  } else {
    // Set previous page data.
    Game.Instance.PreviousPage = Game.Instance.Data.Page;
  }

  // Get title and page from document.
  Game.Instance.Data.Title = WikiPage.title;
  Game.Instance.Data.Page = WikiPage.window.location.href;

  // Check if this should count as a click.
  if (Game.Instance.Data.Page.indexOf(Game.Instance.PreviousPage) === -1) {
    Game.Instance.Clicks += 1;
  }

  // Big brother is watching.
  $(".game-data .page-title").html(Game.Instance.Data.Title );
  $(".game-data .clicks").text(Game.Instance.Clicks);

  // Check if we've reached the finish!
  if (Game.Instance.Data.Page == Game.Instance.TargetPage) {
    alert("You've completed the challenge with "+Game.Instance.Clicks+" clicks!");
    // close wikipage, blablabla.
    return GameStop();
  }

}


function GameStop() {
  if (typeof(WikiPage) !== "undefined") WikiPage.close();
  $("section#intro").show();
  $("section#game").hide();
}