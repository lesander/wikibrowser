/**
 * Wikipedia Random Browser
 * By Sander Laarhoven
 * https://git.io/wikigame
 * Licensed under the MIT License
 * Copyright (c) 2016 Sander Laarhoven All Rights Reserved.
 */

/*
 * Import modules.
 * ================ */

const remote          = require('electron').remote
const BrowserWindow   = remote.BrowserWindow
const $               = require('jQuery')


/*
 * Game module.
 * ============= */

exports = module.exports = {}


/**
 * Register all event listeners of the application.
 */
exports.RegisterEventListeners = function () {

  console.log('[*] Registering event listeners.')

  /* Start game on click.  */
  $("#game-start").on("click", Game.Start)

  /* Toggle settings page on click. */
  $("#game-config").on("click", Game.ToggleConfig)

  /* Hide Game Over on click. */
  $("#game-over button#close").on("click", function() {
    $("section#intro").show()
    $("section#stats").show()
    $("section#game-over").hide()
    $("section#game").hide()
    $("body").attr("style", "")
  })

  /* Update StartPage on change. */
  UseCustomStartPage = false
  $("input[name=config-enable-custom-startpage]").on("change", function() {
    if ( $("input[name=config-enable-custom-startpage]").is(":checked") ) {
      $("input[name=config-value-custom-startpage]").trigger("change")
      UseCustomStartPage = true
    } else {
      UseCustomStartPage = false
      Game.Settings.StartPage = "https://en.wikipedia.org/wiki/Special:Random"
    }
  })

  $("input[name=config-value-custom-startpage]").on("keyup change", function() {
    if (UseCustomStartPage) Game.Settings.StartPage = $(this).val()
  })

  /* Remove item from history on click. */
  $(document).on("click", ".remove-game", function () {
    const gameId = $(this).parent().parent().attr("data-game")
    localStorage.removeItem(gameId)
    Game.UpdateStatistics()
  })

}


/**
 * Start a new game instance.
 */
exports.Start = function () {

  console.log('[!] Starting a new game instance.')

  // Hide introduction section.
  $("section#intro").hide()
  $("section#stats").hide()
  $("section#config").hide()
  $("section#game-over").hide()
  $("section#game").show()

  // Set game instance object.
  Game.Instance = {
    Clicks: "no",
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
  }

  // Get target and random page from settings.
  Game.Instance.StartPage.Page = Game.Settings.StartPage

  // Ask for target page.
  //Game.Instance.TargetPage = prompt("Enter full Wikipedia target URL:")
  Game.Instance.TargetPage = "https://en.wikipedia.org/wiki/Adolf_Hitler"
  if (Game.Instance.TargetPage == null) {
    return Game.Stop()
  }
  if (Game.Instance.TargetPage.indexOf("wikipedia.org/wiki/") === -1) {
    return Game.Start()
  }

  // Load random page!
  WikiPage = new BrowserWindow({show: false, fullscreenable: false})
  WikiPage.loadURL(Game.Instance.StartPage.Page)

  console.log('[*] Loading BrowserWindow with StartPage.')

  // Set statistics.
  Game.Instance.Clicks = "no"

  // Game is ready.
  WikiPage.once("ready-to-show", Game.PageReady)

  // We're navigating to a new page.
  WikiPage.webContents.on("did-finish-load", Game.PageReady)

  // Stop if wikipage is closed.
  WikiPage.on("closed", function () {
    if (typeof WikiPage === "undefined") {
      $("#game-over button#close").click()
    }
    console.log('[!] WikiPage was closed.')
  })

}

/**
 * Prepare the game window once it's loaded.
 */
exports.PageReady = function () {

  WikiPage.show()
  console.log('[*] WikiPage PageReady event emitted.', WikiPage.webContents)

  // First page?
  if (Game.Instance.Clicks === "no") {

    // Set start page.
    console.log('[*] First page has been loaded.')
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
    Game.Instance.PreviousPage = Game.Instance.Data.Page

  }

  // Get title and page from document.
  Game.Instance.Data.Title = WikiPage.webContents.getTitle().replace(" - Wikipedia", "")
  Game.Instance.Data.Page = WikiPage.webContents.getURL()

  // Check if this should count as a click. (if we're on a new page)
  if (Game.Instance.Data.Page.indexOf(Game.Instance.PreviousPage) === -1) { //TODO: better comparison, strip hashes.

    console.log('[*] Adding click to total game clicks.')

    // Add click.
    Game.Instance.Clicks += 1

    // Add new history.
    var newHistory = { Title: Game.Instance.Data.Title, Page: Game.Instance.Data.Page }
    Game.Instance.History[0+Game.Instance.Clicks] = newHistory
    $(".game-data .history-data").append(Game.Instance.Data.Title+ " > ")

  }

  // Add image and styles to page.
  Game.StripWiki()

  // Big brother is watching.
  $(".game-data .page-title").html(Game.Instance.Data.Title )
  $(".game-data .clicks").text(Game.Instance.Clicks)

  // Check if we've reached the finish!
  if (Game.Instance.Data.Page == Game.Instance.TargetPage) {

    console.log('[*] Finished game.')

    // Collect easy-to-read history.
    var NiceHistory = $(".game-data .history-data").text()
    // Save this game.
    Game.Save(Game.Instance.StartPage.Page, Game.Instance.TargetPage,
             Game.Instance.Clicks, Game.Instance.History)
    // Update page statistics.
    Game.UpdateStatistics()
    // Close WikiPage and do not show main sections.
    setTimeout(Game.Stop(), 200)
    // Open the Game over section.
    setTimeout(Game.Over(Game.Instance, NiceHistory), 300)

  }

}


/**
 * Save the finsihed game
 * to storage.
 */
exports.Save = function (StartPage, TargetPage, clicks, history) {

  console.log('[*] Saving game statistics to localStorage.')

  var StartPage = StartPage.replace("https://en.wikipedia.org/wiki/", "")
  var TargetPage = TargetPage.replace("https://en.wikipedia.org/wiki/", "")

  var GameData = {
    "clicks": clicks,
    "StartPage": StartPage,
    "TargetPage": TargetPage,
    "history": history
  }

  localStorage.setItem(
    "WikiGame||"+new Date().getTime()+"||"+
    StartPage+"||"+TargetPage, JSON.stringify(GameData)
  )

}


/**
 * Hide game elements and return to the main page.
 */
exports.Stop = function () {

  console.log('[!] Stopping game.')

  $("section#intro").show()
  $("section#stats").show()
  $("section#game").hide()
  $(".game-data .page-title").text("")
  $(".game-data .history-data").text("")
  $(".game-data .clicks").text("0")
  console.log(remote)
  if (typeof(WikiPage) !== "undefined") WikiPage.close()
}


/**
 * Toggle configuration.
 */
exports.ToggleConfig = function () {
  $("section#config").slideToggle(500)
}


/**
 * Update  the game statistics.
 */
exports.UpdateStatistics = function () {

  console.log('[*] Updating statistics table.')

  if (localStorage.length < 1) {
    $("#stats #games").html("<h4>Nothing to see here yet..</h4>")
    return
  }

  $("#stats #games").html('<table class="table">\
    <thead><tr>\
      <th>Clicks</th>\
      <th>Start Page</th>\
      <th>Target Page</th>\
      <th></th>\
    </tr></thead>\
    <tbody></tbody>\
  </table>')

  for (var i = 0; i < localStorage.length; i++) {
    var game = JSON.parse ( localStorage.getItem( localStorage.key(i) ) )
    var history = game.history
    var tr = '\
    <tr data-game="'+localStorage.key(i)+'">\
      <td>'+game.clicks+'</td>\
      <td>'+history[0].Title+'</td>\
      <td>'+history[history.length-1].Title+'</td>\
      <td>\
        <a class="remove-game" href="#"><i class="glyphicon glyphicon-remove"></i></a>\
      </td>\
    </tr>'
    $("#stats #games tbody").append(tr)
  }

}


/**
 * Display game over message.
 */
exports.Over = function (Game, NiceHistory) {

  console.log('[*] Displaying game over message.')

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
exports.StripWiki = function () {

  console.log('[*] Injecting JavaScript into WikiPage.')

  const style  = 'text-align:center;text-transform:uppercase;'
  const execJS = 'l=document.getElementsByClassName("mw-wiki-logo")[0];'+
                 'l.setAttribute("style", "background-image:'+
                 'url(\'https://raw.githubusercontent.com/lesander/wikibrowser/master/assets/img/logo.png\')");'+
                 'document.getElementById("mw-head-base").setAttribute("style", "height:38px;");'+
                 'l.setAttribute("href", "#");' +
                 'document.getElementById("mw-panel").innerHTML += "<p style=\''+style+'\'>'+Game.Instance.Clicks+' Click(s)</p>";'+
                 'document.getElementById("footer").innerHTML = "";' +
                 'document.getElementById("mw-head").innerHTML = "";' +
                 'p = document.getElementsByClassName("portal");'+
                 'for (var i = 0; i < p.length; i++) {p[i].setAttribute("style", "display:none;")}'
  WikiPage.webContents.executeJavaScript(execJS)
}
