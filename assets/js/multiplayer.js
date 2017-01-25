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
const Peer            = require('peerjs')
const apiKey          = require(__dirname+'/../../package.json').apiKey
const $               = require('jquery')

/*
 * Game module.
 * ============= */
exports = module.exports = {}


exports.Host = () => {

  let peer = new Peer({key: apiKey})

  peer.on('open', (id) => {
    console.log('My peer ID is: ' + id + '. Share this with your friend!')
  })

  peer.on('connection', (conn) => {
    conn.on('open', () => {
      console.log('[!] Connection opened.')
      conn.send('Hello from the other side lol.')
      $('#slut').on('send', (event, message) => {
        conn.send(message)
      })
    })

    conn.on('data', function(data) {
      console.log(data)
    })
  })
}

exports.Join = (hostId) => {
  let peer = new Peer({key: apiKey})
  console.log('[!] Trying to join host '+hostId)
  let conn = peer.connect(hostId)

  conn.on('data', (data) => {
    console.log(data)
  })

  conn.on('open', () => {
    console.log('[!] Connection opened.')
    conn.send('The joined person says hi.')
    $('#slut').on('send', (event, message) => {
      conn.send(message)
    })
  })
}

exports.Send = (message) => {
  $('#slut').trigger('send', message)
}
