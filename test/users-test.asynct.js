/*
 * users-test.js: Tests for the jitsu users API.
 *
 * (C) 2010, Nodejitsu Inc.
 *
 */
 
require.paths.unshift(require('path').join(__dirname, '..', 'lib'));

var assert = require('assert'),
    jitsu = require('jitsu'),
    it = require('it-is'),
    inspect = require('eyes').inspector({ stream: null })
    helper = require('./lib/mock-helpers')

/*
  calling:
  jitsu users create elvis
  should:
    prompt the user for email and password
    make POST request to server.
*/

var POST = 'POST', GET = 'GET'

var mockRequest = helper.mockRequest
  , mockPrompt = helper.mockPrompt
  , makeReq = helper.makeReq
  , res = helper.res
  , makeCommandTest = helper.makeCommandTest

exports ['jitsu users create elvis'] = makeCommandTest(
    ['users','create','elvis'],//command
    mockPrompt({email: 'e@mailinator.com', password: '12345'}),//prompt
    [ [ makeReq(POST,'/users/elvis',{
          email:'e@mailinator.com',
          password:'12345',
          username:'elvis'
        }),
        null, //successful response is blank.
        200 ] ],
    assert.ifError)

exports ['jitsu users create elvis ERROR 400'] = makeCommandTest(
    ['users','create','elvis'],//command
    mockPrompt({email: 'e@mailinator.com', password: '12345'}),//prompt
    res(makeReq(POST, "/users/elvis", {
          "email":"e@mailinator.com",
          "password":"12345",
          "username":"elvis"} ),null,400),
    function (err){
      console.log(arguments)
      it(err).has({
        statusCode: 400
      })
    })

exports ['jitsu users create elvis ERROR 403'] = makeCommandTest(
    ['users','create','elvis'],//command
    mockPrompt({email: 'e@mailinator.com', password: '12345'}),//prompt
    res(makeReq(POST,"/users/elvis",
          {"email":"e@mailinator.com","password":"12345","username":"elvis"}),{},403),
    function (err){
      console.log(arguments)
      it(err).has({
        statusCode: 403
      })
    })

exports ['jitsu users create elvis ERROR 500'] = makeCommandTest(
    ['users','create','elvis'],//command
    mockPrompt({email: 'e@mailinator.com', password: '12345'}),//prompt
    res(makeReq(POST, "/users/elvis",
          {"email":"e@mailinator.com","password":"12345","username":"elvis"}),{},500),
    function (err){
      console.log(arguments)
      it(err).has({
        statusCode: 500
      })
    })

exports ['jitsu users create jimmy'] = makeCommandTest(
    ['users','create','jimmy'],//command
    mockPrompt({email: 'j@mailinator.com', password: '98765'}),//prompt
    res(makeReq(POST,"/users/jimmy",
          {"email":"j@mailinator.com","password":"98765","username":"jimmy"})),
    assert.ifError)

exports ['jitsu users available jimmy'] = makeCommandTest(
    ['users','available','jimmy'],//command
    null,//no prompt
    res(makeReq(GET, "/users/jimmy/available"),//can now send json: and request will automaticially stringify and set Content-Type to application/json
        { available: true }),
    assert.ifError
    )

exports ['jitsu users confirm'] = makeCommandTest (
    ['users','confirm','jimmy'],//command
    mockPrompt({'Invite code': 'f4387f4'}),//prompt
    res(makeReq(POST,"/users/jimmy/confirm",
          {"username":"jimmy","inviteCode":"f4387f4"})),
    assert.ifError )

exports ['jitsu users confirm'] = makeCommandTest(
    ['users','confirm','jimmy'],//command
    mockPrompt({'Invite code': 'f4387f4'}),//prompt
    res(makeReq(POST,"/users/jimmy/confirm",
          {"username":"jimmy","inviteCode":"f4387f4"}),
        {error: "username jimmy is taken"},
        200 ),
    assert.ifError)

exports ['jitsu users forgot'] = makeCommandTest(
    ['users','forgot','jimmy'],//command
    null,//no prompt
    res(makeReq(POST, "/users/jimmy/forgot", {})),
    assert.ifError)


