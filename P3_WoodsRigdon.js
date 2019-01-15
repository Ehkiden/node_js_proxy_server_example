/*
    CS 316 Project 3
    Authors:    Trent Woods, Jared Rigdon
*/

/* Global/Const Variables */
const LOWERPORT = 2000;
const UPPERPORT = 35000;
const Port = randomPort();
const Host = 'iris.cs.uky.edu';
var serverRequest = null;
var serverResponse = null;

const http = require('http');
const fs = require('fs');
const exec = require('child_process').exec;

/* Random Port Selection */
function randomPort(){
    var rando;
    rando = Math.floor(Math.random() * (UPPERPORT - LOWERPORT + 1)) + LOWERPORT;
    return rando;
}

/* url_scrubber to get the desired content */
function url_scrubber(){
    var func_rex = /^\/COMIC\/|\/SEARCH\/|\/MYFILE\//;
    var funChoose = (serverRequest.url).match(func_rex);

    if (funChoose == "/COMIC/"){
        //get the latter half and pass to giveComic()
        var rex_parse =/\/\d{4}-\d{1,2}-\d{1,2}$|\/CURRENT$/;
        var parsed_req = (serverRequest.url).match(rex_parse);
        return giveComic(parsed_req);
    }
    else if (funChoose == "/SEARCH/"){
        //get search term and call doSearch()
        var rex_parse =/\w+$/;
        var parsed_req = (serverRequest.url).match(rex_parse);
        return doSearch(parsed_req);
    }
    else {
        //get file name and call giveFile()
        var rex_parse =/\w+\.html$/;
        var parsed_req = (serverRequest.url).match(rex_parse);
        return giveFile(parsed_req);
    }
}

/* giveComic uses the latter half of the url to determine what to send to the exec process */
function giveComic(parsed_request){
    var url_resp;
    if (parsed_request == "/CURRENT"){
        url_resp = 'https://dilbert.com';
    }
    else{
        url_resp = 'https://dilbert.com/strip'+parsed_request;
    }
    execProcess(url_resp);
}

/* doSearch inserts the latter half of the request to be passed to the exec process */
function doSearch(parsed_request){
    var url_resp = 'https://duckduckgo.com/html/?q='+parsed_request+'&ia=web';
    execProcess(url_resp);
}

/* giveFile gets the parsed request and trys to check if it exists and trys to read it. If possible, then display it on the webpage */
function giveFile(parsed_request){
    //set the path to use to find the file
    var path='./private_html/'+parsed_request;  //we assume that private_html is located in the current working dir
    serverResponse.writeHead(200, {'Content-Type': 'text/html'});
    var content;   

    if (fs.existsSync(path)){
        console.log("Sure.");   //testing only
        fs.readFile(path, function(err, data){
            if(err){
                serverResponse.writeHead(404);
                serverResponse.write("Error in reading the file.");
                serverResponse.end();
            }
            else{
                //display the file if no errors were found
                content = data;
                console.log("Content of file: "+content);   //testing
                serverResponse.write(content);
                serverResponse.end();
            }
        });
    }
    else{
        console.log("Error in opening.");
        serverResponse.writeHead(404);
        serverResponse.write("Error 404: File not Found.");
        serverResponse.end();
    }
}

/* execProcess executes the curl command to the appropraite webpage to ensure it can be loaded during the assynchronous process */
function execProcess(args){
    exec('curl ' + args, function (error, stdout, stderr) {
        if (error != null) {
          console.log('exec error: ' + error);
        }
        else{
            //redirect the page to the appropraite 
            //serverResponse.writeHead(301, {'Location': args});
            serverResponse.write(stdout);
        }
        serverResponse.end();
      });
}

/*  serveURL function 
    recieves the requested url and uses rex to determine if the url is a valid response and then pass to the url_scrubber
*/
function serveURL(request, response){
    //Check if valid url
    if (request.url != "/favicon.ico"){ //just for a windows issue

        var url_rex=/^\/COMIC\/\d{4}-\d{1,2}-\d{1,2}$|^\/COMIC\/CURRENT$|^\/SEARCH\/\w+$|^\/MYFILE\/\w+\.html$/;
        var url_check = (request.url).match(url_rex);

        if (url_check != null){
            //assign to global variables each time a new request is submitted
            serverRequest = request;
            serverResponse = response;

            //display in the console.log if the request url is valid
            console.log(request.url + " Valid");

            //call url scrubber to get the results
            url_scrubber();
            }
        else{
            console.log(request.url + " Bad");
            response.writeHead(200, {'Content-Type': 'text/html'});
            response.write("403: Invalid Request");
            response.end();
        }
    }
}


/* Initialize the server and display the listening url*/
const server = http.createServer(serveURL); //serveURL is the main func to process the requests

server.listen(Port, function(){
    console.log('Server started. Listening on http://'+ Host +':'+ Port);
});
