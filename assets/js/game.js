/**
 * Wikipedia Random Browser v1.0.0
 * By Sander Laarhoven
 * https://github.com/lesander/wikibrowser
 * MIT Licensed (c) 2016
 */

/* Include modules. */
const remote = require('electron').remote
const BrowserWindow = remote.BrowserWindow
const $ = require('jQuery')

/* Set global empty objects. */
Game = {}
let WikiPage

/* Define game settings. */
Game.Settings = {
  RandomPage: "https://en.wikipedia.org/wiki/Special:Random"
}

/* Update game statistics. */
GameUpdateStats()

/* Start game on click.  */
$("#game-start").on("click", GameStart)

/* Toggle settings page on click. */
$("#game-config").on("click", ToggleConfig)

/* Hide Game Over on click. */
$("#game-over button#close").on("click", function() {
  $("section#intro").show()
  $("section#stats").show()
  $("section#game-over").hide()
  $("section#game").hide()
  $("body").attr("style", "")
})

/* Update RandomPage on change. */
UseCustomRandomPage = false
$("input[name=config-enable-custom-startpage]").on("change", function() {
  if ( $("input[name=config-enable-custom-startpage]").is(":checked") ) {
    $("input[name=config-value-custom-startpage]").trigger("change")
    UseCustomRandomPage = true
  } else {
    UseCustomRandomPage = false
    Game.Settings.RandomPage = "https://en.wikipedia.org/wiki/Special:Random"
  }
})

$("input[name=config-value-custom-startpage]").on("keyup change", function() {
  if (UseCustomRandomPage) Game.Settings.RandomPage = $(this).val()
})

/**
 * Start a new game instance.
 */
function GameStart() {

  // Hide introduction section.
  $("section#intro").hide()
  $("section#stats").hide()
  $("section#config").hide()
  $("section#game-over").hide()
  $("section#game").show()

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
  }

  // Get target and random page from settings.
  Game.Instance.RandomPage = Game.Settings.RandomPage

  // Ask for target page.
  //Game.Instance.TargetPage = prompt("Enter full Wikipedia target URL:")
  Game.Instance.TargetPage = "https://en.wikipedia.org/wiki/Adolf_Hitler"
  if (Game.Instance.TargetPage == null) {
    return GameStop()
  }
  if (Game.Instance.TargetPage.indexOf("wikipedia.org/wiki/") === -1) {
    return GameStart()
  }

  // Load random page!
  WikiPage = new BrowserWindow({show: false, fullscreenable: false})
  WikiPage.loadURL(Game.Instance.RandomPage)

  // Set statistics.
  Game.Instance.Clicks = "none"

  // Game is ready.
  WikiPage.once("ready-to-show", GameReady)

  // We're navigating to a new page.
  WikiPage.webContents.on("did-finish-load", GameReady)

  // Stop if wikipage is closed.
  WikiPage.on("closed", GameStop)

}

/**
 * Prepare the game window once it's loaded.
 */
function GameReady() {

  WikiPage.show()
  console.log(WikiPage.webContents)

  // First page?
  if (Game.Instance.Clicks === "none") {
    wikiStrip()
    // Set start page.
    console.log(WikiPage)
    Game.Instance.StartPage.Page = WikiPage.webContents.getURL()
    Game.Instance.StartPage.Title = WikiPage.webContents.getTitle().replace(" - Wikipedia", "")
    // Set to zero.
    Game.Instance.Clicks = 0
    // Set previous page to StartPage.
    Game.Instance.PreviousPage = Game.Instance.StartPage.Page
    // Set first history item.
    Game.Instance.History[0] = Game.Instance.StartPage
    $(".game-data .history-data").append(Game.Instance.StartPage.Title+ " > ")
  } else {
    // Set previous page data.
    console.log('setting previous page data')
    Game.Instance.PreviousPage = Game.Instance.Data.Page
    console.log('previous page is ', Game.Instance.PreviousPage)
  }

  // Get title and page from document.
  Game.Instance.Data.Title = WikiPage.webContents.getTitle().replace(" - Wikipedia", "")
  Game.Instance.Data.Page = WikiPage.webContents.getURL()

  // Check if this should count as a click. (if we're on a new page)
  if (Game.Instance.Data.Page.indexOf(Game.Instance.PreviousPage) === -1) { //TODO: better comparison, strip hashes.

    // Add click.
    Game.Instance.Clicks += 1

    // Add new history.
    var newHistory = { Title: Game.Instance.Data.Title, Page: Game.Instance.Data.Page }
    Game.Instance.History[0+Game.Instance.Clicks] = newHistory
    $(".game-data .history-data").append(Game.Instance.Data.Title+ " > ")

    // Add image and styles to page.
    wikiStrip()

  }

  // Big brother is watching.
  $(".game-data .page-title").html(Game.Instance.Data.Title )
  $(".game-data .clicks").text(Game.Instance.Clicks)

  // Check if we've reached the finish!
  if (Game.Instance.Data.Page == Game.Instance.TargetPage) {
    // Collect easy-to-read history.
    var NiceHistory = $(".game-data .history-data").text()
    // Save this game.
    GameSave(Game.Instance.StartPage.Page, Game.Instance.TargetPage,
             Game.Instance.Clicks, Game.Instance.History)
    // Update page statistics.
    GameUpdateStats()
    // Close WikiPage and do not show main sections.
    GameStop()
    // Open the Game over section.
    setTimeout(GameOver(Game.Instance, NiceHistory), 100)
  }

}

/**
 * Save the finsihed game
 * to storage.
 */
function GameSave(StartPage, TargetPage, clicks, history) {
  var StartPage = StartPage.replace("https://en.wikipedia.org/wiki/", "")
  var TargetPage = TargetPage.replace("https://en.wikipedia.org/wiki/", "")
  var GameData = {
    "clicks": clicks,
    "StartPage": StartPage,
    "TargetPage": TargetPage,
    "history": history
  }
  localStorage.setItem("WikiGame||"+new Date().getTime()+"||"+
  StartPage+"||"+TargetPage, JSON.stringify(GameData))
}

/**
 * Hide game elements and return to the main page.
 */
function GameStop() {
  $("section#intro").show()
  $("section#stats").show()
  $("section#game").hide()
  $(".game-data .page-title").text("")
  $(".game-data .history-data").text("")
  $(".game-data .clicks").text("0")
  if (typeof(WikiPage) !== "undefined") WikiPage.close()
}

/**
 * Toggle configuration.
 */
function ToggleConfig() {
  $("section#config").slideToggle(500)
}

/**
 * Update  the game statistics.
 */
function GameUpdateStats() {

  if (localStorage.length < 1) {
    $("#stats #games").html("<h4>Nothing to see here yet..</h4>")
    return
  }

  $("#stats #games").html('<table class="table">\
    <thead><tr>\
      <th>Clicks</th>\
      <th>Start Page</th>\
      <th>Target Page</th>\
    </tr></thead>\
    <tbody></tbody>\
  </table>')

  for (var i = 0; i < localStorage.length; i++) {
    var game = JSON.parse ( localStorage.getItem( localStorage.key(i) ) )
    var history = game.history
    var tr = '<tr> <td>'+game.clicks+'</td> <td>'+history[0].Title+'</td>\
                   <td>'+history[history.length-1].Title+'</td> </tr>'
    $("#stats #games tbody").append(tr)
  }
}

/**
 * Display game over message.
 */
function GameOver(Game, NiceHistory) {
  $("#game-over .clicks").text(Game.Clicks)
  $("#game-over .game-history").text(NiceHistory.replace(/ > $/, ''))
  $("section#game-over").show()
  $("section#intro").hide()
  $("section#stats").hide()
  $("body").attr("style", "overflow-y: hidden")
}

/**
 * Strip the wikipedia page of the main menu, footer, search bar and add
 * our own logo and clicks counter.
 */
function wikiStrip() {
  const style  = 'text-align:center;text-transform:uppercase;'
  const execJS = 'l=document.getElementsByClassName("mw-wiki-logo")[0];'+
                 'l.setAttribute("style", "background-image:'+
                 'url(\'https://raw.githubusercontent.com/lesander/wikibrowser/electron/assets/img/logo.png\')");'+
                 'document.getElementById("mw-head-base").setAttribute("style", "height:38px;");'+
                 'l.setAttribute("href", "#");' +
                 'document.getElementById("mw-panel").innerHTML += "<p style=\''+style+'\'>'+Game.Instance.Clicks+' Click(s)</p>";'+
                 'document.getElementById("footer").innerHTML = "";' +
                 'document.getElementById("mw-head").innerHTML = "";' +
                 'p = document.getElementsByClassName("portal");'+
                 'for (var i = 0; i < p.length; i++) {p[i].setAttribute("style", "display:none;")}'
  WikiPage.webContents.executeJavaScript(execJS)
}
