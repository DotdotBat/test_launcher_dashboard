require('dotenv').config()
const express = require('express');
const path = require('path');
const { spawn } = require('child_process');
const app = express();
const port = 3000;
const basicAuth = require("express-basic-auth");

isAllureAvailable = process.env.REPORTER == 'allure'
username = process.env.QA_DASHBOARD_USERNAME
pswd = process.env.QA_DASHBOARD_PASSWORD 

if(!username){
    console.error(`No credentials are in .env file. 
        Please create a .env file at the root of the project
        and set QA_DASHBOARD_USERNAME and QA_DASHBOARD_PASSWORD
        for example:
        QA_DASHBOARD_USERNAME="user"
        QA_DASHBOARD_PASSWORD="pass"

        setting credentials to the example above
        `);
    username = "user";
    pswd = "pass";
}
app.use(
    basicAuth({
        users: {[username]:pswd},
        challenge: true,
        unauthorizedResponse:
            "Unauthorized access. Please provide valid credentials.",
    })
);

let reportDir = 'monocart-report'
if(isAllureAvailable){
    reportDir = 'allure-report'
}
app.use('/report', express.static(path.join(__dirname, reportDir)));


app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'index.html'));
});


let connections = [];
let outputHistory = [];
let areTestsRunning = false;

app.get('/tests-status', (req, res)=> {
    res.json({running:areTestsRunning});
});

function sendEventToAll(data) {
    const eventData = `data: ${JSON.stringify(data)}\n\n`;
    outputHistory.push(data);
    connections.forEach(connection => {
        try {
            connection.write(eventData);
        } catch (error){
            console.error('Error writing to connection:', error)
            console.log("Destroying the connection:", connection)
            connection.destroy()
        }
    });
}

function addConnection(res) {
    connections.push(res);
    res.on('close', () => {
        const index = connections.indexOf(res);
        if (index !== -1) connections.splice(index, 1);
    });
}

function cleanup() {//todo: rename descriptively
    connections.forEach(connection => connection.end());
    connections = [];
    outputHistory = [];
    areTestsRunning = false;
}

app.get('/run-tests', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    if (areTestsRunning) {
        addConnection(res);
        outputHistory.forEach(data => {
            res.write(`data: ${JSON.stringify(data)}\n\n`);
        });
        return;
    }

    areTestsRunning = true;
    connections = [];
    outputHistory = [];
    addConnection(res);
    
    const testsRunTask = spawn('npx', ['playwright', 'test'], { 
        cwd: __dirname,
        shell: true
    });

    const handleOutput = (data, type) => sendEventToAll({
        type: type,
        data: data.toString()
    });

    testsRunTask.stdout.on('data', (data) => handleOutput(data, 'TEST_OUTPUT'));
    testsRunTask.stderr.on('data', (data) => handleOutput(data, 'TEST_OUTPUT'));

    

    testsRunTask.on('close', (code) => {
        sendEventToAll({ type: 'TEST_COMPLETE', code: code });
        //tests completed, so we can start generating the report
        let npx_command = ['-c', 'echo "monocart reports"']//monocart report already generated, but we have to say something.

        if(isAllureAvailable){
            npx_command = ['allure', 'generate', 'allure-results', '--clean', '-o', 'allure-report']
        }
        const reportGenerationTask = spawn('npx', npx_command, {
            cwd: __dirname,
            shell: true
        });

        reportGenerationTask.stdout.on('data', (data) => handleOutput(data, 'REPORT_OUTPUT'));
        reportGenerationTask.stderr.on('data', (data) => handleOutput(data, 'REPORT_OUTPUT'));
    
        reportGenerationTask.on('close', (code) => {
            sendEventToAll({ type: 'REPORT_COMPLETE', code: code });
            cleanup();
        });

    });


   
});


app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});