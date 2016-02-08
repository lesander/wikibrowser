/**
 * Wikipedia Random Browser v1.0.0
 * By Sander Laarhoven
 * https://github.com/lesander/wikibrowser
 * MIT Licensed (c) 2016
 */


/* Include modules. */
var gui = require('nw.gui');
var $ = require('jQuery');

/* Set nodewebkit window and empty game object. */
NwWin = gui.Window;
Game = {};

/* Show debug tools. */
NwWin.get().showDevTools();

/* Game Settings! */
Game.Settings = {
  RandomPage: "https://en.wikipedia.org/wiki/Special:Random"
};

/* Update stats. */
GameUpdateStats();

/* Start game on click.  */
$("#game-start").on("click", GameStart);

/* Toggle settings page on click. */
$("#game-config").on("click", ToggleConfig);

/* Hide Game Over on click. */
$("#game-over button#close").on("click", function() {
  $("section#intro").show();
  $("section#stats").show();
  $("section#game-over").hide();
  $("section#game").hide();
  $("body").attr("style", "");
});

/* Update RandomPage on change. */
UseCustomRandomPage = false;
$("input[name=config-enable-custom-startpage]").on("change", function() {
  if ( $("input[name=config-enable-custom-startpage]").is(":checked") ) {
    $("input[name=config-value-custom-startpage]").trigger("change");
    UseCustomRandomPage = true;
  } else {
    UseCustomRandomPage = false;
    Game.Settings.RandomPage = "https://en.wikipedia.org/wiki/Special:Random";
  }
});

$("input[name=config-value-custom-startpage]").on("keyup change", function() {
  if (UseCustomRandomPage) Game.Settings.RandomPage = $(this).val();
});

/* Start the game! */
function GameStart() {

  // Hide introduction section.
  $("section#intro").hide();
  $("section#stats").hide();
  $("section#config").hide();
  $("section#game-over").hide();
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
    RandomPage: null,
    History: []
  };

  // Get target and random page from settings.
  Game.Instance.RandomPage = Game.Settings.RandomPage;

  // Ask for target page.
  //Game.Instance.TargetPage = prompt("Enter full Wikipedia target URL:");
  Game.Instance.TargetPage = "https://en.wikipedia.org/wiki/Adolf_Hitler";
  if (Game.Instance.TargetPage == null) {
    return GameStop();
  }
  if (Game.Instance.TargetPage.indexOf("wikipedia.org/wiki/") === -1) {
    return GameStart();
  }

  // Load random page!
  WikiPage = NwWin.open(Game.Instance.RandomPage, {
    title: "Wikipedia Random Browser Game",
    toolbar: false,
    focus: true
  });

  // Set statistics.
  Game.Instance.Clicks = "none";

  // Gets called on every page change.
  WikiPage.on("loaded", GameReady);

  // Stop if wikipage is closed.
  WikiPage.on("closed", GameStop);

}

function GameReady() {

  // Disable search input.
  $(WikiPage.window.document).find("input[type=search]").attr("disabled", "").attr("placeholder", "Searching = cheating");
  //$(WikiPage.window.document).find("h1").append("<script>alert(WikiPage.window.location.href)</script>");

  // First page?
  if (Game.Instance.Clicks === "none") {
    // Set start page.
    Game.Instance.StartPage.Page = WikiPage.window.location.href;
    Game.Instance.StartPage.Title = WikiPage.title.replace(" - Wikipedia, the free encyclopedia", "");
    // Set to zero.
    Game.Instance.Clicks = 0;
    // Set previous page to StartPage.
    Game.Instance.PreviousPage = Game.Instance.StartPage.Page;
    // Set first history item.
    Game.Instance.History[0] = Game.Instance.StartPage;
    $(".game-data .history-data").append(Game.Instance.StartPage.Title+ " > ");
  } else {
    // Set previous page data.
    Game.Instance.PreviousPage = Game.Instance.Data.Page;
  }

  // Get title and page from document.
  Game.Instance.Data.Title = WikiPage.title.replace(" - Wikipedia, the free encyclopedia", "");
  Game.Instance.Data.Page = WikiPage.window.location.href;

  // Check if this should count as a click.
  if (Game.Instance.Data.Page.indexOf(Game.Instance.PreviousPage) === -1) {
    Game.Instance.Clicks += 1;
    var newHistory = { Title: Game.Instance.Data.Title, Page: Game.Instance.Data.Page };
    Game.Instance.History[0+Game.Instance.Clicks] = newHistory;
    $(".game-data .history-data").append(Game.Instance.Data.Title+ " > ");
  }

  // Big brother is watching.
  $(".game-data .page-title").html(Game.Instance.Data.Title );
  $(".game-data .clicks").text(Game.Instance.Clicks);

  // Check if we've reached the finish!
  if (Game.Instance.Data.Page == Game.Instance.TargetPage) {
    // Collect easy-to-read history.
    var NiceHistory = $(".game-data .history-data").text();
    // Save this game.
    GameSave(Game.Instance.StartPage.Page, Game.Instance.TargetPage,
             Game.Instance.Clicks, Game.Instance.History);
    // Update page statistics.
    GameUpdateStats();
    // Close WikiPage and do not show main sections.
    GameStop();
    // Open the Game over section.
    setTimeout(GameOver(Game.Instance, NiceHistory), 100);
  }

}

function GameSave(StartPage, TargetPage, clicks, history) {
  var StartPage = StartPage.replace("https://en.wikipedia.org/wiki/", "");
  var TargetPage = TargetPage.replace("https://en.wikipedia.org/wiki/", "");
  var GameData = {
    "clicks": clicks,
    "StartPage": StartPage,
    "TargetPage": TargetPage,
    "history": history
  };
  localStorage.setItem("WikiGame||"+new Date().getTime()+"||"+
  StartPage+"||"+TargetPage, JSON.stringify(GameData));
}

function GameStop() {
  $("section#intro").show();
  $("section#stats").show();
  $("section#game").hide();
  $(".game-data .page-title").text("");
  $(".game-data .history-data").text("");
  $(".game-data .clicks").text("0");
  if (typeof(WikiPage) !== "undefined") WikiPage.close();
}

function ToggleConfig() {
  $("section#config").slideToggle(500);
}

function GameUpdateStats() {

  if (localStorage.length < 1) {
    $("#stats #games").html("<h4>Nothing to see here yet..</h4>");
    return;
  }

  $("#stats #games").html('<table class="table">\
    <thead><tr>\
      <th>Clicks</th>\
      <th>Start Page</th>\
      <th>Target Page</th>\
    </tr></thead>\
    <tbody></tbody>\
  </table>');

  for (var i = 0; i < localStorage.length; i++) {
    var game = JSON.parse ( localStorage.getItem( localStorage.key(i) ) );
    var history = game.history;
    var tr = '<tr> <td>'+game.clicks+'</td> <td>'+history[0].Title+'</td>\
                   <td>'+history[history.length-1].Title+'</td> </tr>';
    $("#stats #games tbody").append(tr);
  }
}

function GameOver(Game, NiceHistory) {
  $("#game-over .clicks").text(Game.Clicks);
  $("#game-over .game-history").text(NiceHistory.replace(/ > $/, ''));
  $("section#game-over").show();
  $("section#intro").hide();
  $("section#stats").hide();
  $("body").attr("style", "overflow-y: hidden;");
}
