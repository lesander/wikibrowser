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

let Game            = require('./assets/js/game')
    Game.version    = require(__dirname+'/package.json').version

/*
 * Define app globals.
 * ==================== */

let WikiPage
Game.Settings = {}
Game.Settings.StartPage  = "https://en.wikipedia.org/wiki/Special:Random"
Game.Settings.TargetPage = "https://en.wikipedia.org/wiki/Adolf_Hitler"


/*
 * Initialize the game.
 * ===================== */

//Game.LoadConfiguration()

Game.UpdateStatistics()

Game.RegisterEventListeners()
