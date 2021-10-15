// node main.js --url="https://www.espncricinfo.com/series/icc-cricket-world-cup-2019-1144415/match-results" --excel=worldcup1.csv --datafolder=data



let minimist = require("minimist");
let fs = require("fs");
let axios = require("axios");
let jsdom = require("jsdom");
let excel = require("excel4node");
let pdf = require("pdf-lib");
let path = require("path");


let args = minimist(process.argv);

let p = axios.get(args.url);
p.then(function (responce) {
    let html = responce.data;
    // console.log(html);
    let dom = new jsdom.JSDOM(html);
    let document = dom.window.document;
    let matchdivs = document.querySelectorAll("div.match-score-block");
    let matches = [];

    for (let i = 0; i < matchdivs.length; i++) {
        let matchdiv = matchdivs[i];
        let match = {
            t1: "",
            t2: "",
            t1s: "",
            t2s: "",
            result: ""
        };

        let names = matchdiv.querySelectorAll("div.name-detail > p.name");
        match.t1 = names[0].textContent;
        match.t2 = names[1].textContent;

        let scores = matchdiv.querySelectorAll("div.score-detail > span.score");

        if (scores.length == 2) {
            match.t1s = scores[0].textContent;
            match.t2s = scores[1].textContent;
        }
        else if (scores.length == 1) {
            match.t1s = scores[0].textContent;
            match.t2s = "";
        }
        else {
            match.t1 = "";
            match.t2 = "";
        }

        let resultSpan = matchdiv.querySelector("div.status-text > span");

        match.result = resultSpan.textContent;

        matches.push(match);

    }

    let matchesjson = JSON.stringify(matches);

    fs.writeFileSync("matches.json", matchesjson, "utf-8");

    // console.log(matches);
    let teams = [];

    for (let i = 0; i < matches.length; i++) {
        singleteam(teams, matches[i]);
    }
    for (let i = 0; i < matches.length; i++) {
        team_mataches(teams, matches[i]);
    }

    let teamsjson = JSON.stringify(teams);
    fs.writeFileSync("teams.json", teamsjson, "utf-8");

    createExcelFile(teams);
    createFolders(teams);

    //  console.log(teams);
})

function createFolders(teams) {
    fs.mkdirSync(args.datafolder);
    for (let i = 0; i < teams.length - 1; i++) {
        let teamsn = path.join(args.datafolder, teams[i].name);
        fs.mkdirSync(teamsn);

        for (let j = 0; j < teams[i].matches1.length; j++) {
            let matchp = path.join(teamsn, teams[i].matches1[j].vs + ".pdf");
            createScoreCard(teams[i].name, teams[i].matches1[j], matchp);

        }
    }
}

function createScoreCard(team, match, matchp) {
    let t1 = team;
    let t2 = match.vs;
    let t1s = match.selfscore;
    let t2s = match.oppscore;
    let result = match.result;

    let bytesofpdft = fs.readFileSync("Template.pdf");
    let pdfdockaprom = pdf.PDFDocument.load(bytesofpdft);
    pdfdockaprom.then(function (pdfdoc) {
        let page = pdfdoc.getPage(0);

        page.drawText(t1, {
            x: 320,
            y: 729,
            size: 8
        });
        page.drawText(t2, {
            x: 320,
            y: 715,
            size: 8
        });
        page.drawText(t1s, {
            x: 320,
            y: 701,
            size: 8
        });
        page.drawText(t2s, {
            x: 320,
            y: 687,
            size: 8
        });
        page.drawText(result, {
            x: 320,
            y: 673,
            size: 8
        });

        let finalpromise = pdfdoc.save();
        finalpromise.then(function (final) {
            fs.writeFileSync(matchp, final);
        })

    })
}

function createExcelFile(teams) {
    let wb = new excel.Workbook();
    for (let i = 0; i < teams.length - 1; i++) {
        let sheet = wb.addWorksheet(teams[i].name);
        sheet.cell(1, 1).string("VS");
        sheet.cell(1, 2).string("Self Score");
        sheet.cell(1, 3).string("Opp Score");
        sheet.cell(1, 4).string("Result");
        for (let j = 0; j < teams[i].matches1.length; j++) {
            sheet.cell(2 + j, 1).string(teams[i].matches1[j].vs);
            sheet.cell(2 + j, 2).string(teams[i].matches1[j].selfscore);
            sheet.cell(2 + j, 3).string(teams[i].matches1[j].oppscore);
            sheet.cell(2 + j, 4).string(teams[i].matches1[j].result);
        }
    }
    wb.write(args.excel);
}

function team_mataches(teams, match) {
    let t1id = -1;
    for (let i = 0; i < teams.length; i++) {
        if (teams[i].name == match.t1) {
            t1id = i;
            break;
        }
    }
    let team1 = teams[t1id];
    teams[t1id].matches1.push({
        vs: match.t2,
        selfscore: match.t1s,
        oppscore: match.t2s,
        result: match.result
    })


    let t2id = -1;
    for (let i = 0; i < teams.length; i++) {
        if (teams[i].name == match.t2) {
            t2id = i;
            break;
        }
    }
    let team2 = teams[t2id];
    teams[t2id].matches1.push({
        vs: match.t1,
        selfscore: match.t2s,
        oppscore: match.t1s,
        result: match.result
    })
}


function singleteam(teams, match) {
    let t1id = -1;
    for (let i = 0; i < teams.length; i++) {
        if (teams[i].name == match.t1) {
            t1id = i;
            break;
        }
    }
    if (t1id == -1) {
        teams.push({
            name: match.t1,
            matches1: []
        })
    }

    let t2id = -1;
    for (let i = 0; i < teams.length; i++) {
        if (teams[i].name == match.t2) {
            t2id = i;
            break;
        }
    }
    if (t2id == -1) {
        teams.push({
            name: match.t2,
            matches1: []
        })
    }
}


