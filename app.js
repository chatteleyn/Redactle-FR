const express = require('express');
const app = express();

let fetch = require('node-fetch');
let { DOMParser } = require('xmldom');

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
        }

        return response;
    }
    else {
        return content;
    }
}

app.get('/api/:pageid', async (req, res) => {
    res.send(await getPageContent(req.params.pageid));
})

/*
app.get('/:pageid', async (req, res) => {
    res.send(req.params.pageid);
})*/

app.use('/:pageid', express.static('public'))

app.get('/', async (req, res) => {
    res.redirect('/'+9104);
})

//app.use(express.static('public'));

app.listen(8080, () => {
    console.log('Running server');
});