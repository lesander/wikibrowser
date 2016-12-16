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

const {remote, shell} = require('electron')
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

  /* Let's set the version of the app while we're at it. */
  $(".credits span").text('v'+Game.version)

  $("a[data-external]").on("click", function () {
    shell.openExternal($(this).attr("data-external"))
  })

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

  /* Update configuration on change. */
  $('input[name=config-startpage], input[name=config-targetpage]').on('change', function () {
    const key = $(this).attr('data-key')
    const value = $(this).val()
    Game.UpdateConfiguration(key, value)
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
  Game.Instance.TargetPage = Game.Settings.TargetPage

  // Sanity check the pages.
  if (Game.Instance.TargetPage == null || Game.Instance.TargetPage.indexOf("wikipedia.org/wiki/") === -1) {
    return Game.Stop()
  }

  // Load random page!
  WikiPage = new BrowserWindow({show: false, fullscreenable: false})
  WikiPage.loadURL(Game.Instance.StartPage.Page)

  console.log('[*] Loading BrowserWindow with StartPage.')

  // Set statistics.
  Game.Instance.Clicks = "no"

  // Game is ready or we're navigating to a new page.
  // These events will only both fire at the first page load.
  WikiPage.once("ready-to-show", Game.PageReady)
  WikiPage.webContents.on("did-finish-load", Game.PageReady)

  // Stop if wikipage is closed.
  WikiPage.on("closed", function () {
    console.log('[!] WikiPage was closed.')
    Game.Stop()
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
  WikiPage.destroy()
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

  // Is there anything to see?
  if (localStorage.length < 1) {
    $("#stats #games").html("<h4>Nothing to see here yet..</h4>")
    return
  }

  // Add empty table.
  $("#stats #games").html('<table class="table">\
    <thead><tr>\
      <th>Clicks</th>\
      <th>Start Page</th>\
      <th>Target Page</th>\
      <th><i class="glyphicon glyphicon-list-alt"></i></th>\
    </tr></thead>\
    <tbody></tbody>\
  </table>')

  // Loop through all localStorage relevant data.
  Game.SavedGames = 0
  for (var i = 0; i < localStorage.length; i++) {
    if (localStorage.key(i).indexOf('WikiGame') === -1) continue
    Game.SavedGames++
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

  if (Game.SavedGames === 0) {
    $("#stats #games").html("<h4>Nothing to see here yet..</h4>")
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
                 'document.getElementById("p-navigation").innerHTML = "<p style=\''+style+'\'>'+Game.Instance.Clicks+' Click(s)</p>";'+
                 'document.getElementById("footer").innerHTML = "";' +
                 'document.getElementById("mw-head").innerHTML = "";' +
                 'p = document.getElementsByClassName("portal");'+
                 'for (var i = 0; i < p.length; i++) {p[i].setAttribute("style", "display:none;")};'+
                 'document.getElementById("p-navigation").setAttribute("style", "display:block;")'
  WikiPage.webContents.executeJavaScript(execJS)
}

/**
 * Load the saved configuration from storage and display
 * the values inside the config menu.
 */
exports.LoadConfiguration = function () {

  StartPage = localStorage.getItem('WikiBrowser_StartPage') || Game.Settings.Defaults.StartPage
  TargetPage = localStorage.getItem('WikiBrowser_TargetPage') || Game.Settings.Defaults.TargetPage

  Game.Settings.StartPage = StartPage
  Game.Settings.TargetPage = TargetPage

  $('input[name=config-startpage]').val(StartPage).attr('placeholder', StartPage)
  $('input[name=config-targetpage]').val(TargetPage).attr('placeholder', TargetPage)

}

/**
 * Update the configuration.
 * @param {string} key
 * @param {string} value
 */
exports.UpdateConfiguration = function (key, value) {
  Game.Settings[key] = value
  return localStorage.setItem('WikiBrowser_'+key, value)
}
