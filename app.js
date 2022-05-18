const express = require('express');
const app = express();

let fetch = require('node-fetch');
let { DOMParser } = require('xmldom');

let pageList = require('./articles.json');

let textNodes = ['p', 'blockquote', 'a', 'i', 'b'];
let excludedClasses = ['reference', 'mw-editsection'];

function containsExcludedClasses(node) {
    if (node.attributes) {
        for (let attr of Object.keys(node.attributes)) {
            if (node.attributes[attr].nodeName === 'class') {
                return node.attributes[attr].nodeValue.split(' ').some(element => {
                    return excludedClasses.includes(element);
                })
            }
        }
    }
    return false;
}

function extractList(node) {
    let elements = []
    for (let child of Object.keys(node.childNodes)) {
        if (node.childNodes[child].nodeName === "li") {
            elements.push(extractText(node.childNodes[child]));
        }
    }
    return elements;
}

function extractText(node) {
    if (!containsExcludedClasses(node)) {
        if (node.nodeType === node.TEXT_NODE && node.data) {
            return node.data;
        }
        else if (node.childNodes) {
            let text = '';
            for (let child of Object.keys(node.childNodes)) {
                text += extractText(node.childNodes[child]);
            }
            return text;
        }
    }
    return '';
}

async function getPageContent(pageId) {
    let response = {
        'elements': []
    };

    const url = "https://fr.wikipedia.org/w/api.php?" +
        new URLSearchParams({
            origin: "*",
            action: "parse",
            prop: "text",
            pageid: pageId,
            format: "json",
        });

    const req = await fetch(url);
    const content = await req.json();
    if (!content.error) {
        response.title = content.parse.title;
        response.elements.push({
            type: 'h1',
            content: content.parse.title
        });

        let html = new DOMParser().parseFromString(content.parse.text['*']);
        let nodeList = html.firstChild.childNodes;

        for (let node of Object.keys(nodeList)) {
            if (textNodes.includes(nodeList[node].nodeName)) {
                response.elements.push({
                    type: 'text',
                    content: extractText(html.firstChild.childNodes[node])
                });
            }
            else if (nodeList[node].nodeName === 'h1') {
                response.elements.push({
                    type: 'h1',
                    content: extractText(html.firstChild.childNodes[node])
                });
            }
            else if (nodeList[node].nodeName === 'h2') {
                response.elements.push({
                    type: 'h2',
                    content: extractText(html.firstChild.childNodes[node])
                });
            }
            else if (nodeList[node].nodeName === 'h3') {
                response.elements.push({
                    type: 'h3',
                    content: extractText(html.firstChild.childNodes[node])
                });
            }
            else if (nodeList[node].nodeName === 'ul') {
                response.elements.push({
                    type: 'ul',
                    content: extractList(html.firstChild.childNodes[node]).map(i => { return { type: 'text', content: i }; })
                });
            }
            else if (nodeList[node].nodeName === 'il') {
                response.elements.push({
                    type: 'il',
                    content: extractList(html.firstChild.childNodes[node]).map(i => { return { type: 'text', content: i }; })
                });
            }
        }

        return response;
    }
    else {
        return content;
    }
}

async function getPageid(title) {
    const url = "https://fr.wikipedia.org/w/api.php?action=query&list=search&srsearch=" + title + "&utf8=&format=json";
    const req = await fetch(url);
    const content = await req.json();
    return content.query.search[0].pageid;
}

app.get('/api/:pageid', async (req, res) => {
    res.send(await getPageContent(req.params.pageid));
})

app.use('/:pageid', express.static('public'))

app.get('/', async (req, res) => {
    let pageTitle = pageList.list[Math.floor(Math.random() * pageList.list.length)];
    res.redirect('/' + await getPageid(pageTitle));
})

app.listen(8080, () => {
    console.log('Running server');
});