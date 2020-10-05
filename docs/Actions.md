# Actions

- Custom
  - [definition](#definition)
  - [placeholder](#placeholder)
- Eval
  - [Eval.javascript](#Eval.javascript)
- Flow
  - [Flow.computeOutcome](#Flow.computeOutcome)
  - [Flow.dynamicOutput](#Flow.dynamicOutput)
  - [Flow.each](#Flow.each)
  - [Flow.else](#Flow.else)
  - [Flow.elseIf](#Flow.elseIf)
  - [Flow.expect](#Flow.expect)
  - [Flow.fail](#Flow.fail)
  - [Flow.find](#Flow.find)
  - [Flow.group](#Flow.group)
  - [Flow.if](#Flow.if)
  - [Flow.leaveContext](#Flow.leaveContext)
  - [Flow.output](#Flow.output)
  - [Flow.sleep](#Flow.sleep)
  - [Flow.success](#Flow.success)
  - [Flow.while](#Flow.while)
- Global
  - [Global.appendGlobal](#Global.appendGlobal)
  - [Global.setGlobal](#Global.setGlobal)
- Page
  - [Page.click](#Page.click)
  - [Page.fetch](#Page.fetch)
  - [Page.hover](#Page.hover)
  - [Page.input](#Page.input)
  - [Page.inputFile](#Page.inputFile)
  - [Page.navigate](#Page.navigate)
  - [Page.screenshot](#Page.screenshot)
  - [Page.setCookies](#Page.setCookies)
  - [Page.setUserAgent](#Page.setUserAgent)
  - [Page.setValue](#Page.setValue)

# Custom

<h2 id="definition">definition</h2>


Defines a pipeline which can subsequently be used in other actions via Use Definition pipe.

### Use For

- extracting common functionality (e.g. inbound and outbound flight selection would share common parts for extracting flight information, prices, etc.)


<h2 id="placeholder">placeholder</h2>


Use this action to get quick access to pipeline configuration and deciding what to do with its results later.

After pipeline is congifured, use Change Type to convert the placeholder into one of the actions.

Running the placeholder will result in an error.


# Eval

<h2 id="Eval.javascript">Eval.javascript</h2>


Executes arbitrary JavaScript code.

Following top-level variables are available:

- `els` — output set of pipeline
- `el` — first element of `els` (for convenience, when dealing with single-element pipes)
- `ctx` — a context object


# Flow

<h2 id="Flow.computeOutcome">Flow.computeOutcome</h2>


Computes a pipeline, storing a result which can subsequently be accessed
with `Flow.getOutcome` pipe.


<h2 id="Flow.dynamicOutput">Flow.dynamicOutput</h2>


Sends a dynamic Job Output, with both `key` and `data` being evaluated at runtime
rather than pre-defined at scripting time.

The pipeline should return a single element with `key: string` and `data: any`.


<h2 id="Flow.each">Flow.each</h2>


Iterates over a set of elements, passing control to children and modifying their scope.

The pipeline should resolve to a list of elements.
On every run the internal index is incremented, and the element at current index becomes the scope of children.

After last child is executed, the control is passed back to Each.
Each exits when there are no more elements left to iterate over.

Note: every time the children are executed the scope is re-evaluated;
specifically, if scope element disappears (or some other pipeline failure occurs),
then children won't be able to execute.

### Use For

- iterating over web page elements (e.g. passenger forms)
- executing actions per each item of the array


<h2 id="Flow.else">Flow.else</h2>


Passes control flow to the children only if neither one of the preceeding If or Else If actions were entered.

This action must be placed next to either If or another Else If action.
All adjacent If, Else If and Else actions form a single chain with a guarantee that at most one branch is entered.

### Use For

- general purpose branching and conditional execution


<h2 id="Flow.elseIf">Flow.elseIf</h2>


Same as If, but does not evaluate the pipeline if any preceeding If or Else If action was entered.

This action must be placed next to either If or another Else If action.
All adjacent If, Else If and Else actions form a single chain with a guarantee that at most one branch is entered.

### Use For

- general purpose branching and conditional execution


<h2 id="Flow.expect">Flow.expect</h2>


Fails with specified error code if condition holds `false` over specified time.

The pipeline should produce a single element with boolean value.
If the value is `false`, the pipeline is run again until either the condition becomes `true` or timeout occurs.

Expect actions are used to catch expected anomalies in script execution (e.g. validation errors)
so that a  specific error code is thrown instead of a generic one
(e.g. `FlightNotFoundError` vs `ElementNotFoundError`).

By default action will retry the pipeline multiple times on `false` outcomes,
until it either becomes `true` or the timeout occurs.
This behaviour, along with custom timeouts, can be useful for waiting arbitrarily long processes
(e.g. loading screens, progress bars, interstitials, etc.)

Note: context matchers are special kinds of expects, which do not accept error codes and custom timeouts.
The treatment of pipeline results are otherwise identical to Expect actions.

### Parameters

- error code: a custom error code to throw if expectation fails
- custom timeout: a timeout in milliseconds

### Use For

- asserting on-page conditions
- increasing error specificity on expected failures
- waiting for arbitrarily long processes to finish


<h2 id="Flow.fail">Flow.fail</h2>


Finishes script execution with `fail` status, and specified error code.

Additionally, allows extracting and sending message alongside the failure event.
This message can be obtained by constructing a pipeline which returns a string value.

### Parameters

- error code: specifies execution error to throw

### Use For

- failing a script with specified error code


<h2 id="Flow.find">Flow.find</h2>


Passes control to the children, modifying their scope.

The pipeline should return a single element, which becomes the scope of the children
(this is also known as _scope inheritance_).

Note: every time the children are executed the scope is re-evaluated;
specifically, if scope element disappears (or some other pipeline failure occurs),
then children won't be able to execute.

### Parameters

- optional: if checked, the pipeline is allowed to return 0 elements in which case the action is bypassed
  (the children will not be entered), otherwise an error is thrown if pipeline returns 0 elements

### Use For

- restrict children to a specific fragment of the page
- provide children with common input data and input DOM node
- with optional, conditionally skip a number of actions if pipeline yields 0 elements


<h2 id="Flow.group">Flow.group</h2>


Groups a set of actions.

### Use For

- structuring and organizing scripts


<h2 id="Flow.if">Flow.if</h2>


Conditionally passes control to children, based on the pipeline result.

The pipeline which should return a single element with boolean value.
If the value is `true`, then the control is passed to the children, otherwise child actions are bypassed.

The scope of children is not modified by this pipeline (children will receive the scope from the parent of this action).

### Use For

- general purpose branching and conditional execution


<h2 id="Flow.leaveContext">Flow.leaveContext</h2>


Leaves current context. The subsequent execution step will be context matching.

### Use For

- advanced scripting, where fine grained flow control is required


<h2 id="Flow.output">Flow.output</h2>


Sends Job Output with specified Output Key.

The pipeline should return a single element.
Its value will be sent as output data.

Note: multiple elements are not automatically serialized to arrays;
use Fold Array to send arrays instead.


<h2 id="Flow.sleep">Flow.sleep</h2>


Waits for specified number of milliseconds.

This is unreliable (but easy) method of waiting for arbitrarily long processes to finish.
It is recommended to use Expect for scripting such cases, whenever it is possible to do so.

### Parameters

- delay: milliseconds to wait


<h2 id="Flow.success">Flow.success</h2>


Finishes script execution with Success status.

Note: normally, success is reported via success contexts.
Use this action only when imperative success handling is required.

### Use For

- advanced scripting, when exiting early is required


<h2 id="Flow.while">Flow.while</h2>


Loops over child actions while the condition holds `true`.

The pipeline should resolve to a single element with boolean value.
If the value is `true`, the control is passed to children, otherwise the children are skipped.
After last child is executed, the control is passed back to While so that the condition could be checked again.

The scope of children is not modified by this pipeline (children will receive the scope from the parent of this action).

### Parameters

- limit: maximum number of iterations allowed (to prevent endless loops)

### Use For

- creating general purpose loops which execute actions whilst the condition is met
  (e.g. click button until something happens)


# Global

<h2 id="Global.appendGlobal">Global.appendGlobal</h2>


Evaluates pipeline and appends resulting values to Global variable, which should contain an array.

If no global with specified key exists yet, creates an empty array before appending to it.


<h2 id="Global.setGlobal">Global.setGlobal</h2>


Sets a global variable, which can be subsequently obtained using Get Global pipe.

The pipeline should return a single element. Its value will be associated with specified key.


# Page

<h2 id="Page.click">Page.click</h2>


Clicks the element on the page.

The pipeline should return a single DOM element where the click will be performed.

The value of the element is ignored. In practice, values are useful to find a particular element out of collection.
For example, given a list of flights a pipeline can be contructed to find a particular flight row
and click an element inside of it.

The element where the click is performed should be visible (have non-zero visual area) and reachable by coordinates.
If the element is hidden under some other overlaying elements, the overlays will be temporary removed before clicking,
and then restored after clicking.

Important: the effect of the click (e.g. a form submission) cannot be guaranteed,
thus it is a good practice to place an [Expect](#expect) next to Click to capture the observable effect on the webpage
(e.g. a confirmation message).

The exact algorithm is as follows:

- the scope element is resolved from parent (#document by default)
- the pipeline is executed with scope element as its input set, expecting a single element in the output set
- the element is scrolled into view
- the screenshot is taken (if executed debug screenshots are enabled for the job)
- if the element is `<option>`:
  - the `<select>` element is checked for visibility and reachability
  - the mouse is positioned over `<select>`, producing necessary mouse events
  - the value of the `<select>` is set to the index of the `<option>` element via client-side JavaScript
  - the synthetic `input` and `change` events are fired on `<select>`
- if the element is not `<option>`:
  - the element is checked for visbility, visual dimensions and reachability
  - overlays obscuring the element are temporarily removed
  - the mouse is positioned over the element's center (based on element's bounds), producing necessary mouse events
  - the emulated click is sent to the coordnates of the element's center
  - if navigation has not yet started, the overlaying elements are restored

### Parameters

- optional: if checked, the pipeline is allowed to return 0 elements in which case the action is bypassed,
  otherwise an error is thrown if pipeline returns 0 elements
- wait for stable box: after element is initially scrolled into view the action will wait
  for element's position to remain constant for a few frames;
  this is to prevent accidentally clicking at wrong location if the element is currently involved in an animation
  (e.g. smooth scrolling, carousels, etc.)
- alt: if checked, the emulated click will be sent with Alt key pressed
- ctrl: if checked, the emulated click will be sent with Ctrl key pressed
- shift: if checked, the emulated click will be sent with Shift key pressed
- Meta: if checked, the emulated click will be sent with Meta key pressed

### Use For

- clicking buttons
- selecting options
- submitting forms


<h2 id="Page.fetch">Page.fetch</h2>


Sends a new network request from currently open webpage.

The request is configured using pipeline's output object (see below).
The pipeline should return a single element with object value, which configures the request.

The request follows Content Security Policy (CSP) of the current web page.
This can be a limiting factor, for example when trying to send a request to a domain which is not whitelisted
in `Access-Control-Allow-Origin` header (the same applies to other CORS and CSP headers).
If you are experiencing problems due to CORS and/or CSP, it is recommended to use "nodejs" or "nodejs+proxy" mode.

The request configuration object (the output value of pipeline) can consist of:

- `method`: HTTP request method; `GET`, `POST`, `PUT` or `DELETE` are used most commonly
- `protocol` (e.g. `http:`, `https:`)
- `host` (e.g. `example.com`, `example.com: 3123`)
- `hostname` (e.g. `example.com`)
- `pathname` (e.g. `/path/to/resource`)
- `query`: an object with query parameters (e.g. `{ hello: 'world' }`)
- `headers`: an object with headers (e.g. `{ 'content-type': 'text/plain' }`)
- `body`: an object which configures request body, depends on Request Body Format parameter:
  - none: the body is not included in request (the value is ignored)
  - json: the object is sent as JSON; content type header is set to `application/json`
    if not overridden with `headers`
  - urlencoded: the object is encoded in a similar way to `query` above and is sent in request body;
    content type header is set to `application/x-www-form-urlencoded` if not overridden with `headers`
  - multipart: the content type header is set to `multipart/form-data` and the request body is encoded
    as multipart/form-data stream following the rules:
      - each object key is a separate field
      - if the value is string, a text field is appended to form data
      - if the value is Blob object, the file field is appended to form data (see [Fetch Blob](#fetch-blob) for details)
  - text: the value is sent as a plain text

Note: it is handy to configure the request object using Compose pipe.

### Parameters

- mode: Fetch or XHR (Fetch is preferred, but XHR may be necessary if website replaces `window.fetch`
  with its own incompatible implementation)
- request body format: specifies how to treat `/ body` of request object (see above)
- response body format: specifies how to parse the response

### Use For

- advanced scripting, to send network requests manually


<h2 id="Page.hover">Page.hover</h2>


Same as Click, but does not send emulated Mouse Down and Mouse Up events.
Instead, the element is checked for visibility, and the mouse is positioned over it.

### Parameters

See Click.

### Use For

- hovering over elements without clicking them (e.g. to reveal old style dropdown menus which work on mouse hover)


<h2 id="Page.input">Page.input</h2>


Types text into DOM element.

The pipeline should resolve to a single element.
The value of the element must be a string — it will be sent to the DOM node as a series of keyboard events.

In order to handle keyboard events properly the element must receive focus.
There are multiple ways of setting the focus, the most reliable way which works in most cases is
to simply click on the element. For simplicity, this action includes a Use Click parameter
which does everything the Click does prior to sending the keyboard events.

However, there are edge cases when performing a click is undesirable (e.g. click opens a popup).
To address these cases there are few more parameters listed below which allow alternative focusing techniques.
Those are to be used at one's own discretion, as they are tightly coupled to website's internal implementation
details and are susceptible to even slightest changes.

The exact algorithm is as follows:

- the scope element is resolved from parent (#document by default)
- the pipeline is executed with scope element as its input set,
  expecting a single element in the output set and a string or number value
- the element is scrolled into view
- if Use Click is enabled, a subset of Click algorithm is performed on the element
- if Clear input is enabled, the entire text is selected and Backspace keystroke is sent to the webpage,
  causing the input to become clear
- a series of keystrokes is sent to the element as emulated keyboard events
- if Press Enter is enabled, an Enter keystroke is sent to the webpage
- if Use Blur is enabled, a synthetic `blur` event is triggered on the element via client-side JavaScript
- the screenshot is taken (if executed debug screenshots are enabled for the job)

### Parameters

- optional: if checked, the pipeline is allowed to return 0 elements in which case the action is bypassed,
  otherwise an error is thrown if pipeline returns 0 elements
- wait for stable box: after element is initially scrolled into view the action will wait for element's position
  to remain constant for a few frames; this is to prevent accidentally clicking at wrong location
  if the element is currently involved in an animation (e.g. smooth scrolling, carousels, etc.)
- check visibility: if unchecked, visibility check is bypassed (deprecated, incompatible with Use Click)
- use click: if checked, Click is used to focus the element
- use ticks: if checked, an small artificial delay is inserted between keystrokes; otherwise all keystrokes
  are sent simultaneously
- clear input: if checked, the text of the element is selected and cleared prior to typing text
- press Enter: if checked, an Enter keystroke is sent to the webpage after typing text
- use blur: if checked, a synthetic `blur` event is triggered on the element after typing

### Use For

- typing text into text input fields


<h2 id="Page.inputFile">Page.inputFile</h2>


Sets file (blob data) to `<input type = "file" />`.

The pipeline should produce a single element with `<input type = "file" />` and Blob object value.
The action assigns the blob to this input, allowing for uploading files using `multipart/form-data` forms.

The pipeline should return a Blob object which consists of:

- `blobId` (string) a unique blob identifier
- `filename` (string)

The Blob object should first be downloaded using [Fetch Blob](#fetch-blob).

### Use For

- uploading files via HTML forms (`<input type = "file"/>`)


<h2 id="Page.navigate">Page.navigate</h2>


Navigates to the URL, evaluated by pipeline.

The pipeline should produce a single element with string value, which is treated as URL to navigate to.

### Parameters

- reject netwrok errors: if checked, an error will be thrown if navigation results in network-level errors
  (i.e. domain name not resolved, connection failed, etc)
- reject http errors: if checked, an error will be thrown if navigation results in HTTP error
  (i.e. response status code is greater than or equal to 400)
- open new tab: if checked, opens new tab and performs navigation in it (the new tab also becomes active)
- close other tabs: if checked, closes all other tabs after navigating, useful in conjunction with "Open new tab"

### Use For

- performing initial navigation
- navigating to known URLs (e.g. checkout page)


<h2 id="Page.screenshot">Page.screenshot</h2>


Captures the screenshot and sends it to the Job.

### Parameters

- full page: emulate viewport to match content width and content height of current webpage,
  which generally results in full page screenshot
  (unless the page uses scrollable containers with fixed width or height)
- public: mark screenshots as public
- min width: minimum width for full page emulation
- max width: maximum width for full page emulation
- min height: minimum height for full page emulation
- max height: maximum height for full page emulation

### Use For

- taking debug screenshots
- sending public screenshots


<h2 id="Page.setCookies">Page.setCookies</h2>


Sets cookies by reading an array from specified Job Input.

Cookie array should consist of objects with following keys:

- `name`
- `value`
- `url`
- `domain`
- `path`
- `secure`
- `httpOnly`
- `sameWebsite`
- `expires`

### Use For

- scripting flows which require cookies to be set prior to navigation


<h2 id="Page.setUserAgent">Page.setUserAgent</h2>


Overrides User Agent and Platform visible to web pages.


<h2 id="Page.setValue">Page.setValue</h2>


Similar to Page.input, but modifies DOM value of output element directly,
by assigning to `value` DOM property.

### See Also

- Page.input: for addition details
