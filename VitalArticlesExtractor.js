let fetch = require('node-fetch');
let { DOMParser } = require('xmldom');
let xpath = require('xpath');
const fs = require('fs')

let categoryList = ["Personnalités", "Histoire", "Géographie", "Arts et culture", "Philosophie et religion", "Vie quotidienne", "Société et sciences sociales", "Santé et médecine", "Science", "Technologie", "Mathématiques"];

async function getArticle(category) {
    const url = "https://fr.wikipedia.org/w/api.php?" +
        new URLSearchParams({
            origin: "*",
            action: "parse",
            prop: "text",
            page: "Wikipédia:Articles_vitaux/Niveau/4/" + category,
            format: "json",
        });

    let req = await fetch(url);
    let content = await req.json();
    return content;
}

async function getArticleList() {
    let pageList = [];
    for (category of categoryList) {
        console.log(category);
        let content = await getArticle(category);
        let html = new DOMParser().parseFromString(content.parse.text['*']);
        let elements = xpath.select("//div[@class=\"colonnes\"]//li//a[@title]", html);
        for (element of elements) {
            pageList.push(element.firstChild.data)
        }
    }
    return pageList;
}

getArticleList().then(list => {
    fs.writeFileSync("articles.json", JSON.stringify({ "list": list }));
});

