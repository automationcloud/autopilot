# Pipes

- Assert
  - [Assert.exists](#Assert.exists)
  - [Assert.one](#Assert.one)
- Boolean
  - [Boolean.and](#Boolean.and)
  - [Boolean.not](#Boolean.not)
  - [Boolean.or](#Boolean.or)
- Browser
  - [Browser.getBlob](#Browser.getBlob)
  - [Browser.getCookies](#Browser.getCookies)
  - [Browser.getFrameInfo](#Browser.getFrameInfo)
  - [Browser.selectNetworkResources](#Browser.selectNetworkResources)
  - [Browser.selectTargets](#Browser.selectTargets)
- Custom
  - [Custom.label](#Custom.label)
- DOM
  - [DOM.batchExtract](#DOM.batchExtract)
  - [DOM.closest](#DOM.closest)
  - [DOM.document](#DOM.document)
  - [DOM.getAttribute](#DOM.getAttribute)
  - [DOM.getChildText](#DOM.getChildText)
  - [DOM.getComputedStyle](#DOM.getComputedStyle)
  - [DOM.getDocumentProperty](#DOM.getDocumentProperty)
  - [DOM.getHref](#DOM.getHref)
  - [DOM.getInnerHtml](#DOM.getInnerHtml)
  - [DOM.getInnerText](#DOM.getInnerText)
  - [DOM.getText](#DOM.getText)
  - [DOM.getTextContent](#DOM.getTextContent)
  - [DOM.getValue](#DOM.getValue)
  - [DOM.hasClass](#DOM.hasClass)
  - [DOM.iframe](#DOM.iframe)
  - [DOM.innermost](#DOM.innermost)
  - [DOM.isDisabled](#DOM.isDisabled)
  - [DOM.isSelected](#DOM.isSelected)
  - [DOM.isVisible](#DOM.isVisible)
  - [DOM.matches](#DOM.matches)
  - [DOM.nextSibling](#DOM.nextSibling)
  - [DOM.outermost](#DOM.outermost)
  - [DOM.parent](#DOM.parent)
  - [DOM.previousSibling](#DOM.previousSibling)
  - [DOM.queryAll](#DOM.queryAll)
  - [DOM.queryOne](#DOM.queryOne)
  - [DOM.queryXPathAll](#DOM.queryXPathAll)
  - [DOM.queryXPathOne](#DOM.queryXPathOne)
- Data
  - [Data.formatUrl](#Data.formatUrl)
  - [Data.restoreLocal](#Data.restoreLocal)
  - [Data.saveLocal](#Data.saveLocal)
- Date
  - [Date.format](#Date.format)
- Definition
  - [Definition.use](#Definition.use)
- Eval
  - [Eval.expression](#Eval.expression)
  - [Eval.ifElse](#Eval.ifElse)
  - [Eval.javascript](#Eval.javascript)
- List
  - [List.append](#List.append)
  - [List.countBy](#List.countBy)
  - [List.every](#List.every)
  - [List.exists](#List.exists)
  - [List.filter](#List.filter)
  - [List.filterOne](#List.filterOne)
  - [List.fromArray](#List.fromArray)
  - [List.length](#List.length)
  - [List.limit](#List.limit)
  - [List.prepend](#List.prepend)
  - [List.repeat](#List.repeat)
  - [List.reverse](#List.reverse)
  - [List.skip](#List.skip)
  - [List.skipWhile](#List.skipWhile)
  - [List.some](#List.some)
  - [List.sortBy](#List.sortBy)
  - [List.takeWhile](#List.takeWhile)
  - [List.toArray](#List.toArray)
- Number
  - [Number.compare](#Number.compare)
  - [Number.mapRange](#Number.mapRange)
  - [Number.sum](#Number.sum)
- Object
  - [Object.assign](#Object.assign)
  - [Object.compose](#Object.compose)
  - [Object.deletePath](#Object.deletePath)
  - [Object.entries](#Object.entries)
  - [Object.fromEntries](#Object.fromEntries)
  - [Object.getPath](#Object.getPath)
  - [Object.hasPath](#Object.hasPath)
  - [Object.pick](#Object.pick)
  - [Object.setPath](#Object.setPath)
  - [Object.wrap](#Object.wrap)
- String
  - [String.extractRegexp](#String.extractRegexp)
  - [String.formatTemplate](#String.formatTemplate)
  - [String.join](#String.join)
  - [String.mapRegexp](#String.mapRegexp)
  - [String.matchesRegexp](#String.matchesRegexp)
  - [String.parseBoolean](#String.parseBoolean)
  - [String.parseColor](#String.parseColor)
  - [String.parseJson](#String.parseJson)
  - [String.parseNumber](#String.parseNumber)
  - [String.parseUrl](#String.parseUrl)
  - [String.removeDiacritics](#String.removeDiacritics)
  - [String.replaceRegexp](#String.replaceRegexp)
  - [String.sanitizeHtml](#String.sanitizeHtml)
- Value
  - [Value.contains](#Value.contains)
  - [Value.containsText](#Value.containsText)
  - [Value.equals](#Value.equals)
  - [Value.equalsText](#Value.equalsText)
  - [Value.getConstant](#Value.getConstant)
  - [Value.getConstantArray](#Value.getConstantArray)
  - [Value.getDynamicInput](#Value.getDynamicInput)
  - [Value.getGlobal](#Value.getGlobal)
  - [Value.getInput](#Value.getInput)
  - [Value.getJson](#Value.getJson)
  - [Value.isEmpty](#Value.isEmpty)
  - [Value.peekInput](#Value.peekInput)

# Assert

<h2 id="Assert.exists">Assert.exists</h2>


Throws an error with specified error code if input set does not contain any elements.
Otherwise, passes the input set along unmodified.

### Use For

- throwing specialized errors in pipelines with multiple filters to narrow down the filtering problems


<h2 id="Assert.one">Assert.one</h2>


Asserts that input set contains exactly one element, otherwise throws a specified error.


# Boolean

<h2 id="Boolean.and">Boolean.and</h2>


Evaluates two operands by passing each element of input set through two different pipelines,
then returns `true` if both operands are `true`, and `false` otherwise.

Inner pipelines should return a single element for each element in input set.
An error is thrown if the result is not a boolean.

### Use For

- combining multiple booleans using logical AND (conjunction)


<h2 id="Boolean.not">Boolean.not</h2>


Returns a logical inverse of input boolean value. An error is thrown if input value is not a boolean.

### Use For

- inverting the results of other boolean-producing pipes


<h2 id="Boolean.or">Boolean.or</h2>


Evaluates two operands by passing each element of input set through two different pipelines,
then returns `false` if both operands are `false`, and `true` otherwise.

Inner pipelines should return a single element for each element in input set.
An error is thrown if the result is not a boolean.

### Use For

- combining multiple booleans using logical OR (conjunction)


# Browser

<h2 id="Browser.getBlob">Browser.getBlob</h2>


Returns blob content in a specified encoding.

Input value must be a Blob object, returned by Send Network Request action with "blob" response type.

Caution: decoding large blobs may result in decreased application and engine performance.

### Use For

- sending base64 encoded blobs as part of Send Network Request action


<h2 id="Browser.getCookies">Browser.getCookies</h2>


Obtains browser cookies and returns them as element values.


<h2 id="Browser.getFrameInfo">Browser.getFrameInfo</h2>


Returns information about current frame and its loading state.

### Use For

- implementing assertions on frame loading, readiness or failure to load


<h2 id="Browser.selectNetworkResources">Browser.selectNetworkResources</h2>


Returns information about network requests and responses that match specified filters.

### Use For

- extracting data from ongoing network requests


<h2 id="Browser.selectTargets">Browser.selectTargets</h2>


Returns information about all currently open browser targets (tabs, popups, windows, iframes),
matching specified criteria.


# Custom

<h2 id="Custom.label">Custom.label</h2>


This pipe is a simple group with a customized label.
The input set is passed to the inner pipeline and the output set of the inner pipeline
becomes the output set of this pipe.

### Use For

- structuring complex pipelines


# DOM

<h2 id="DOM.batchExtract">DOM.batchExtract</h2>


Extracts multiple DOM properties from element or its descendants designated by selector at once.

This pipe replaces a series of Set Path > Query One > Extract pipelines,
and is significantly more efficient.


<h2 id="DOM.closest">DOM.closest</h2>


Returns the closest ancestor of an element matching specified selector.
Throws an error if no such element is found.


<h2 id="DOM.document">DOM.document</h2>


Replace the DOM node of each input element with top #document node.

### Use For

- accessing elements outside of current DOM scope (e.g. inside `each` loop)


<h2 id="DOM.getAttribute">DOM.getAttribute</h2>


Returns the value of specified DOM attribute.
An error is thrown if attribute does not exist on one of the input elements.

### Use For

- extracting information from DOM attributes
    

<h2 id="DOM.getChildText">DOM.getChildText</h2>


Returns text content of direct text node children of an element, ignoring nested elements.

### Use For

- accessing text content of immediate children when semantic markup does not allow
for more precise targeting


<h2 id="DOM.getComputedStyle">DOM.getComputedStyle</h2>


Returns the value of specified style, computed by browser.
Throws an error if the style is not recognized by browser and therefore cannot be computed.

### Use For

- addressing edge cases where filtering or value extraction is only possible by looking at CSS styles
  (e.g. color, borders, etc.)


<h2 id="DOM.getDocumentProperty">DOM.getDocumentProperty</h2>


Retrieves specified property from the element's owner document.

### Use For

- accessing current url
- accessing referrer to compose network requests
- accessing current page title
- accessing other document properties for advanced scripting


<h2 id="DOM.getHref">DOM.getHref</h2>


Returns a fully resolved URL as specified by href attribute of `<a>` DOM elements (links).
An error is thrown if input element is not a link.

### Use For

- extracting absolute href value from links


<h2 id="DOM.getInnerHtml">DOM.getInnerHtml</h2>


Returns `innerHTML` property of an element.

### Use For

- extracting HTML content

### See Also

- String.sanitizeHtml in case the extracted HTML is to be presented to user in some way
  (e.g. via output)


<h2 id="DOM.getInnerText">DOM.getInnerText</h2>


Returns `innerText` DOM property of elements.

### Use For

- reading `innerText` specifically
  (i.e. when fallback logic of Extract Text produces incorrect or unwanted results)


<h2 id="DOM.getText">DOM.getText</h2>


Returns text extracted from DOM element by reading its
innerText, textContent or value (whichever first is defined)
and normalizing the whitespace.

### Use For

- general purpose text extraction from the page

### See Also

- DOM.getValue, DOM.getInnerText, DOM.getTextContent:
  for more specialized extractors that don't fallback over multiple text sources


<h2 id="DOM.getTextContent">DOM.getTextContent</h2>


Returns `textContent` DOM property of elements.

### Use For

- reading `textContent` specifically
  (i.e. when fallback logic of Extract Text produces incorrect or unwanted results)


<h2 id="DOM.getValue">DOM.getValue</h2>


Returns `value` DOM property of elements.

### Use For

- reading `value` specifically
  (i.e. when fallback logic of Text produces incorrect or unwanted results)


<h2 id="DOM.hasClass">DOM.hasClass</h2>


Returns `true` if element contains specified class name, false otherwise.

### Use For

- filtering
- reading boolean state from class names


<h2 id="DOM.iframe">DOM.iframe</h2>


Returns DOM contentDocument node of the IFRAME element.
An error is thrown if applied to non-frame elements.

### Use For

- accessing the contents of iframes


<h2 id="DOM.innermost">DOM.innermost</h2>


Discards elements that enclose other elements from the same set.
This leaves only the "innermost" elements in the output set.

### Use For

- squashing element sets that are loosely defined,
  in particular if website does not have semantic DOM structure to work with

### See Also

- DOM.outermost: for the inverse functionality


<h2 id="DOM.isDisabled">DOM.isDisabled</h2>


For each element returns the value of its `disabled` DOM property.

### Use For

- asserting that buttons or other form controls are interactable


<h2 id="DOM.isSelected">DOM.isSelected</h2>


For each element returns the value of its `selected` or `checked` DOM property.

### Use For

- extracting boolean values of checkboxes, radio buttons and `option` elements


<h2 id="DOM.isVisible">DOM.isVisible</h2>


Returns true if Element is visible, that is:

- its content box has both width and height greater than zero
- its CSS styles don't include visibility: hidden

### Use For

- filtering invisible elements for further manipulations
- asserting element visibility in expectations


<h2 id="DOM.matches">DOM.matches</h2>


Returns `true` if element matches specifed selector.


<h2 id="DOM.nextSibling">DOM.nextSibling</h2>


Returns n-th next DOM sibling of an element.
An error is thrown if no next sibling exists.


<h2 id="DOM.outermost">DOM.outermost</h2>


Discards elements that are enclosed by other elements from the same set.
This leaves only the "outermost" elements in the output set.

### Use For

- squashing element sets that are loosely defined,
  in particular if website does not have semantic DOM structure to work with

### See Also

- DOM.innermost: for the inverse functionality


<h2 id="DOM.parent">DOM.parent</h2>


For each input element returns its DOM parent.
An error is thrown if parent not found (i.e. applied to #document).

### Parameters

- optional: if checked,

### Use For

- traversing DOM hierarchy to locate the desired element


<h2 id="DOM.previousSibling">DOM.previousSibling</h2>


Returns n-th previous DOM sibling of an element.
An error is thrown if no previous sibling exists.


<h2 id="DOM.queryAll">DOM.queryAll</h2>


Returns all Element nodes found by specified selector.

### Use For

- returning a group of elements (e.g. prices) for further manipulation (e.g. text parsing)

### See Also

- DOM.queryOne: for the equivalent pipe which returns a single node


<h2 id="DOM.queryOne">DOM.queryOne</h2>


Returns Element node found by specified selector.
An error is thrown if multiple elements are found within each element.

### Use For

- selecting a unique Element on the page
- for each element in a set, selecting a unique sub-element

### See Also

- DOM.queryAll: for the equivalent pipe which allows multiple elements to be found by selector


<h2 id="DOM.queryXPathAll">DOM.queryXPathAll</h2>


Returns all Element nodes found by specified Xpath expression.

### Use For

- returning a group of elements (e.g. prices) for further manipulation (e.g. text parsing)

### See Also

- DOM.queryXPathOne: for the equivalent pipe which returns a single node


<h2 id="DOM.queryXPathOne">DOM.queryXPathOne</h2>


Returns Element node found by specified Xpath expression.
An error is thrown if multiple elements are found within each element.

### Use For

- selecting a unique Element on the page
- for each element in a set, selecting a unique sub-element

### See Also

- DOM.queryXpathAll: for the equivalent pipe which allows multiple elements to be found by Xpath expression


# Data

<h2 id="Data.formatUrl">Data.formatUrl</h2>


Takes input object with URL components and returns a URL string.

URL components may include following keys:

- protocol (e.g. `http:`, `https:`)
- host (e.g. `example.com`, `example.com:3123`)
- hostname (e.g. `example.com`)
- pathname (e.g. `/path/to/resource`)
- query: an object with query parameters (e.g. `{ hello: 'world' }`)
- hash (e.g. `#link`)

Query parameters are automatically URI-encoded.

An error is thrown if input value is not an object, or if there's not enough information to construct a URL.

### Use For

- composing URLs for network requests and other applications


<h2 id="Data.restoreLocal">Data.restoreLocal</h2>


Restores a set saved with Local Save pipe.
Input set is discared.

### Use For

- Do not. This pipe allows creating very non-intuitive data flows, which are hard to reason about.


<h2 id="Data.saveLocal">Data.saveLocal</h2>


Saves input set, so that it could be later restored with Local Restore.

### Use For

- Do not. This pipe allows creating very non-intuitive data flows, which are nearly impossible to reason about.
- Consider using more conventional tools for solving the problem, or create a custom pipe if none work.


# Date

<h2 id="Date.format">Date.format</h2>


Parses the date from input string using specified input format,
then returns this date formatted using specified output format.

An error is thrown if input data is not a string.

See [moment.js docs](https://momentjs.com/docs/#/parsing/string-format/)
for more information about pattern strings and formatting.

### Use For

- general purpose date parsing and formatting
- filtering on dates (e.g. format Job Input date to match format on the web page)


# Definition

<h2 id="Definition.use">Definition.use</h2>


Passes each element in input set to the specified definition, returning its output.

This pipe is a primary means of working with definitions.
It allows extracting common functionality of different pipelines as a named definition,
so that the same pipes could be reused across multiple actions.

### Use For

- extracting common functionality (e.g. inbound and outbound flight selection
  would share common parts for extracting flight information, prices, etc.)


# Eval

<h2 id="Eval.expression">Eval.expression</h2>


Evaluates expression according to following rules:

- if value starts with `/`, then it is interpreted as a JSON pointer into an input object,
  thus behaving in a similar manner to Get Path
- if value starts with `=`, then the rest is interpreted as a JavaScript expression,
  which has access to top-level keys of input object
- all other values are interpreted as string constants

The `=` mode is also useful for making constants, for example:

- `= true` for booleans,
- `= 42` for numbers,
- `= "/some/path"` for string constants which start with `/`

### Use For

- flexible evaluation of expressions based on input values (arithmetic, boolean, string composition, etc)
- lightweight alternative to JavaScript


<h2 id="Eval.ifElse">Eval.ifElse</h2>


For each element evaluates the condition pipeline.
If condition is 	rue`, evaluates the positive branch pipeline, otherwise evaluates the negative branch.

Condition pipeline should return a single element for each element in input set.
An error is thrown if condition value is not a boolean.

### Use For

- applying different pipelines to elements based on a condition
- advanced scripting


<h2 id="Eval.javascript">Eval.javascript</h2>


Executes an arbitrary JavaScript code and returns its results.

### Use For

- advanced scripting


# List

<h2 id="List.append">List.append</h2>


Concatenates the input set with the output set of inner pipeline.
The input set comes before the inner pipeline's results.

The inner pipeline is executed only once (as opposed to other pipelines
which are executed per each element in input set), with #document element as its input set.
A typical usage is to have a Use Definition pipe inside of it,
so that multiple definitions can be concatenated together.

### Use For

- concatenating elements from multiple definitions or other sources

### See Also

- List.prepend: for similar functionality with different order of elements


<h2 id="List.countBy">List.countBy</h2>


Returns a single element whose value is an object computed as follows:

- each input element is passed through inner pipeline to evaluate a string key
- input elements are then grouped by this key
- the output object consists of key-value pairs where value indicates a count of elements in each group

This is similar to COUNT / GROUP BY from SQL and is primarily used in advanced scripting scenarios
(e.g. calculate the number of passengers in each group).

The DOM node of the result is set to top #document.

### Use For

- advanced scripting


<h2 id="List.every">List.every</h2>


Returns a single #document element with boolean value.

The value is `true` if all of the results of inner pipeline is `true`.

Throws an error if the inner pipeline returns non-boolean value.


<h2 id="List.exists">List.exists</h2>


Returns a single element whose value is `true` if the input set contains one or more elements,
and `false` otherwise. The DOM node of the result is set to top #document.

### Use For

- checking if collection has elements (e.g. as part of filters or matchers)


<h2 id="List.filter">List.filter</h2>


For each input element evaluates the boolean value of inner pipeline.
The element is then discarded if the value is `false`, or kept if the value is `true`.

Inner pipeline must return a single element for each element in the input set.
An error is thrown if the resulting value is not a boolean.

### Use For

- general purpose filtering for various use cases


<h2 id="List.filterOne">List.filterOne</h2>


Same as `List.filter`, but expects exactly one element.


<h2 id="List.fromArray">List.fromArray</h2>


Given an array as input value, creates an element for each value of this array.

For example, if input set contains 2 elements with arrays `[1, 2, 3]` and `[4, 5]` respectively,
then the output set will contain 5 elements with values `1`, `2`, `3`, `4`, `5` respectively.

An error is thrown if input value is not an array.

### Use For

- trasnforming arrays (e.g. from Job Input) into elements for subsequent manipulations with other pipes

### See Also

- List.toArray: for reverse functionality


<h2 id="List.length">List.length</h2>


Returns a single element whose value is a number of elements in the input set.

### Use For

- accessing the count of input elements (e.g. to output the number of available options on the website)


<h2 id="List.limit">List.limit</h2>


Returns specified number of first elements in input set and discards everything else.
A typical usage scenario is to have limit `1` which ensures that the output set only contains a single element.

### Use For

- restricting elements to a single element
  (e.g. for `click` actions, especially when filtering yields more than one element and
  they are functionally equivalent)
- returning sampled data of fixed length


<h2 id="List.prepend">List.prepend</h2>


Concatenates the output set of inner pipeline with the input set.
The input set comes after the inner pipeline's results.

Note: the inner pipeline is executed only once (as opposed to other pipelines
which are executed per each element in input set), with #document element as its input set.
A typical usage is to have a Use Definition pipe inside of it,
so that multiple definitions can be concatenated together.

### Use For

- concatenating elements from multiple definitions or other sources

### See Also

- Append: for similar functionality with different order of elements


<h2 id="List.repeat">List.repeat</h2>


Creates specified number of copies of each input element.


<h2 id="List.reverse">List.reverse</h2>


Returns the elements from the input set in a reversed order.

### Use For

- advanced scripting


<h2 id="List.skip">List.skip</h2>


Discards specified number of elements and returns everything else.

### Use For

- excluding placeholder elements from sets, specifically for `<option>`
  elements whose first element is typically a placeholder and does not represent an actual option
- excluding other kinds of elements like table headers or column headers


<h2 id="List.skipWhile">List.skipWhile</h2>


Starting in specified direction, discards input elements whilst inner pipeline produces `true`.

Unlike Filter, which discards all non-matching elements, this pipe
only discards a continuous sequence of elements either at the start or at the end.

### See Also

- Take While: for opposite effect.


<h2 id="List.some">List.some</h2>


Returns a single #document element with boolean value.

The value is `true` if at least one result of inner pipeline is `true`.

Throws an error if the inner pipeline returns non-boolean value.


<h2 id="List.sortBy">List.sortBy</h2>


For each element evaluates the key using inner pipeline,
then sorts the elements according to this key, in ascending order.

### Use For

- advanced scripting


<h2 id="List.takeWhile">List.takeWhile</h2>


Starting in specified direction, takes input elements whilst inner pipeline produces `true`, and discards the rest.

Unlike Filter, which discards all non-matching elements, this pipe
only discards a continuous sequence of elements either at the start or at the end.

### See Also

- Skip While: for opposite effect.


<h2 id="List.toArray">List.toArray</h2>


Returns a single element whose value is an array containing all values of the input set.
The DOM node of the result is set to top #document.

### Use For

- transforming elements into arrays (e.g. to use as part of Job Output)

### See Also

- Unfold Array: for reverse functionality


# Number

<h2 id="Number.compare">Number.compare</h2>


Evaluates two operands by passing each element of input set through two different pipelines,
then returns the boolean result of numeric comparison of these two operands using specified operator.

Inner pipelines should return a single element for each element in input set.
An error is thrown if the result is not a number.

### Use For

- general purpose numerical comparison (e.g. for matching the number of registered luggage against Job Input)


<h2 id="Number.mapRange">Number.mapRange</h2>


Returns a string value corresponding to one of the configured numeric ranges where the input value belongs to.

The configured ranges must cover the expected numeric domain and must not overlap to prevent ambiguity.

The lower bounds of are always inclusive, whereas the upper bounds are always exclusive.
Therefore, ranges `[0, 3)` and `[3, 5)` form a continuous range `[0, 5)` with no "holes" in it;
and the input value `3` will belong to the second range.

An error is thrown if input value is not a number, or if the number does not belong to any range.

### Use For

- mapping continuous ranges into discrete categories (e.g. passenger age groups)


<h2 id="Number.sum">Number.sum</h2>


Returns a single element whose value is a numeric sum of all input set values.


# Object

<h2 id="Object.assign">Object.assign</h2>


Evaluates an object with inner pipeline,
then merges the resulting object with input object by assigning each key of the result to it.

The inner pipeline must resolve to a single element with object value. An error is thrown if input value is not object/array.

### Use For

- merging multiple objects together (analogous to `Object.assign` in JavaScript)
- mixing data from definition into input object
- assigning defaults values with Overwrite: false


<h2 id="Object.compose">Object.compose</h2>


Creates an object according to specified mappings.

Each mapping specifies a JSON pointer and an expression.
Expressions are evaluated according to rules specified in Expression pipe and are assigned to
corresponding JSON pointers.

### Use For

- shaping output objects with bulk move and assign operations
- building template objects for outputs and network requests, which can subsequently be modified or extended


<h2 id="Object.deletePath">Object.deletePath</h2>


Removes the value at specified path. An error is thrown if input value is not object/array.

### Use For

- removing unwanted or temporary data (e.g. for composing Job Output objects)

### See Also

- Compose: for shaping objects using bulk move operations
- Pick: for whitelisting object keys


<h2 id="Object.entries">Object.entries</h2>


Converts each object into `[key, value]` pairs for each property.

Throws an error if element value is not an object.


<h2 id="Object.fromEntries">Object.fromEntries</h2>


Returns a single object with properties correspinding to each value of the input set.
JSON paths are used to control which properties of input set correspond to key/value of the object.
The DOM node of the result is set to top #document.


<h2 id="Object.getPath">Object.getPath</h2>


Returns the value at specified path.
An error is thrown if datum resolves to undefined.
An error is thrown if input value is not object/array.

### Use For

- accessing nested data of objects and arrays (e.g. Job Inputs)


<h2 id="Object.hasPath">Object.hasPath</h2>


Returns `true` if input object contains anything at specified path.
An error is thrown if input value is not an object or an array.

### Use For

- checking whether optional data is set (e.g. whether inbound flight object is specified)


<h2 id="Object.pick">Object.pick</h2>


Creates an object composed of picked input object keys.
An error is thrown if input value is not object/array.

This is effectively a keys whitelisting operation in a sense that it removes all keys not explicitly listed.

### Use For

- removing unwanted or temporary data (e.g. for composing Job Output objects)
- shaping output objects

### See Also

- Compose: for shaping objects using bulk move operations
- Delete Path: for removing individual keys


<h2 id="Object.setPath">Object.setPath</h2>


Evaluates the inner pipeline for each element and assigns the resulting value
to the input object at specified path.
The inner pipeline must resolve to a single element.
An error is thrown if input value is not an object or an array.

### See Also

- Move Path: for moving values to different keys without modification
- Transform Path: for modifying the value at specified path without moving it

### Use For

- building an object using values from various sources
- modifying or extending existing objects


<h2 id="Object.wrap">Object.wrap</h2>


Returns a new object with input value placed at specified path.

### Use For

- creating objects out of other value types for further manipulation
- collecting data from multiple sources


# String

<h2 id="String.extractRegexp">String.extractRegexp</h2>


Matches input string against specified regular expressions and returns an array of strings,
where first element is a whole match and subsequent elements are captured regex groups.

An error is thrown if input value is not a string.
On No Match parameter controls the behaviour when input string does not match the regular expression,
by default an error is thrown.

See [RegExp#exec](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp/exec)
for more information about regular expressions matching and capturing groups.

### Use For

- extracting parts of string (e.g. to extract flight information from strings like `SFO-18 / 01 / 29`)


<h2 id="String.formatTemplate">String.formatTemplate</h2>


Returns a string formatted according to specified template.
The template allows inserting values from input using syntax
`{/path/to/value}` where `/path/to/value` is a JSON pointer into input object.

An error is thrown if input value is not object/array.

### Use For

- quickly composing a string representation of objects (e.g. for matching or filtering)


<h2 id="String.join">String.join</h2>


Returns a single element with string value, produced by concatenating all values of input elements
with specified separator.

An error is thrown if input set contains object or array values, which are not supported.


<h2 id="String.mapRegexp">String.mapRegexp</h2>


Matches the input string value against specified patterns,
then returns a string that corresponds to the matched pattern.
The behaviour when no patterns match is controlled by On No Match parameter.

An error is thrown if input value is not a string.

### Use For

- mapping enums from one domain to another (e.g. map `mr`, `ms`, `mrs` titles to website format and vice versa)


<h2 id="String.matchesRegexp">String.matchesRegexp</h2>


Returns `true` if input string matches specified regular expression, and `false` otherwise.
An error is thrown iff input value is not a string.

See [String#match](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/match)
for more information about regular expressions matching.

### Parameters

- regexp: regular expression
- flags

### Use For

- general purpose string matching (e.g. as part of matchers or conditions)

### See Also

- Replace Regexp: for replacing string with regular expressions
- Extract Regexp: for retrieving capturing groups


<h2 id="String.parseBoolean">String.parseBoolean</h2>


Parses a boolean value from input string.

An error is thrown if input value is not a string.

### Use For

- parsing booleans obtained from string representation (e.g. from web page attribute)


<h2 id="String.parseColor">String.parseColor</h2>


Parses color value from input string, returning detailed information about color,
including its rgb, hsv, hsl values.


<h2 id="String.parseJson">String.parseJson</h2>


Parses JSON from input value string.

An error is thrown if input value is not a valid JSON string.

### Use For

- advanced scripting (e.g. parse raw network response, or parse JSON from webpage)


<h2 id="String.parseNumber">String.parseNumber</h2>


Parses a number value from input string.

An error is thrown if input value is not a string.

### Use For

- parsing numbers obtained from string representation (e.g. from web page attribute)
  for subsequent use with other numeric pipes


<h2 id="String.parseUrl">String.parseUrl</h2>


Parses input string using embedded URL parser, and returns the result.

The result is an object containing following properties:

- protocol (e.g. `http:`, `https:`)
- host (e.g. `example.com`, `example.com:3123`)
- hostname (e.g. `example.com`)
- pathname (e.g. `/path/to/resource`)
- query: an object with query parameters (e.g. `{ hello: 'world' }`)
- hash (e.g. `#link`)


<h2 id="String.removeDiacritics">String.removeDiacritics</h2>


Replaces accented characters with their ASCII equivalent,
e.g. `å` becomes `a`, `œ` becomes `oe` and so on.

### Use For

- working with international text, especially in matching


<h2 id="String.replaceRegexp">String.replaceRegexp</h2>


Returns a new string with some (or all) matches of specified regular expression replaced with specified replacement.
An error is thrown if input value is not a string.

See [String#replace](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/replace)
for more information about regular expressions and replacement strings.

### Use For

- general purpose search-and-replace (e.g. trim unwanted characters from string)

### See Also

- Matches Regexp: for testing if string matches regular expression
- Extract Regexp: for retrieving capturing groups


<h2 id="String.sanitizeHtml">String.sanitizeHtml</h2>


Takes input string containing HTML markup and removes unsafe tags
(e.g. `<script>`) and attributes (e.g. `onclick`).

An error is thrown if input value is not a string.

### Use For

- pre-processing


# Value

<h2 id="Value.contains">Value.contains</h2>


Evaluates two operands by passing each element of input set through two different pipelines,
then returns a boolean indicating whether operand A conceptually contains operand B.

The result depends on the data type of operand A and is evaluated according to following rules:

- if operand A is an object, then the result is `true` only if operand B is also an object,
  and each value of object B is equal to the corresponding value of object A
- if operand B is an array, then the result is `true` only is operand B is also an array,
  and each item of array B exists in array A
- all other data types are coerced to strings, and `true` is returned if B is a substring of A

Inner pipelines should return a single element for each element in input set.

### Use For

- general purpose containment tests which work across multiple data types, specifically:
  - is string a substring of another string
  - is object a sub-object of another object
  - is array a sub-array of another array

### See Also

- Contains Text: for simpler alternative when second operand is a string constant


<h2 id="Value.containsText">Value.containsText</h2>


Returns `true` if input value contains specified string constant.
Non-string values are coerced to strings and are tested according to rules specified in Contains.

### Parameters

- text: string constant to test the input value against

### Use For

- creating matchers where matching text partially is preferred
- general purpose string containment tests against string constant


<h2 id="Value.equals">Value.equals</h2>


Evaluates two operands by passing each element of input set through two different pipelines,
then returns a boolean indicating whether the resulting values are conceptually equal.

The equality is tested according to following rules:

- strings are compared ignoring case, diacritics and extraneous whitespace
- objects are compared key-by-key recursively (deep equality), keys are compared strictly
- arrays are compared element-wise
- all other data types are coerced to strings and compared according the above rules

Inner pipelines should return a single element for each element in input set.

### Use For

- general purpose equality tests
- filtering by matching data from various sources
  (e.g. one of the operands may obtain Job Inputs to test input values against)

### See Also

- Euqals Text: for simpler alternative when one of the operands is a string constant


<h2 id="Value.equalsText">Value.equalsText</h2>


Returns `true` if input value equals to specified string constant.
Non-string values are coerced to strings and are tested according to rules specified in Equals.

This is simpler equivalent to Equals pipe, where one of the operands is constant.

### Use For

- creating matchers with text equality tests
- general purpose equality tests where one of the operands is constant


<h2 id="Value.getConstant">Value.getConstant</h2>


Returns specified constant value.

### Use For

- obtaining a constant value which never changes across script executions
  (e.g. for navigating to specific constant URL)
- quickly test actions that require a string input


<h2 id="Value.getConstantArray">Value.getConstantArray</h2>


Returns an array of specified constant values.

### Use For

- quickly creating arrays of primitive values (numbers, strings, etc)


<h2 id="Value.getDynamicInput">Value.getDynamicInput</h2>


Returns the value of specified Job Input.
The input key is evaluated using nested pipeline.


<h2 id="Value.getGlobal">Value.getGlobal</h2>


Returns the value of specific Global variable (set by Set Global action).
An error is thrown if Global variable is not set.

### Use For

- accessing global variables (advanced scripting)


<h2 id="Value.getInput">Value.getInput</h2>


Returns the value of specified Job Input.

### Use For

- accessing Job Inputs for further manipulation (e.g. filter by Job Input value)


<h2 id="Value.getJson">Value.getJson</h2>


Returns the specified JSON object.

### Use For

- testing (quickly providing pipelines with any data)
- building templates for Job Outputs and Network Requests,
  which can subsequently be modified or extended


<h2 id="Value.isEmpty">Value.isEmpty</h2>


Returns `true` if input value is either an empty string, an empty array or `null`.
The string is considered empty if it contains nothing but whitespace.

### Use For

- checking for null values, especially if previous pipe is optional
  (that is, allowed to return `null` values instead of throwing errors, which is a common pipe convention)
- checking for empty strings


<h2 id="Value.peekInput">Value.peekInput</h2>


Gets the input without requesting it, i.e. doesn't set job.state = 'awaitingInput' if the input not exists yet.

### Use For

- checking if the Job Input is supplied by the time of playback
