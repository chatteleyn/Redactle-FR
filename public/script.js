let wordList = [];
let answer;

async function getPageContent() {
    let pageid = window.location.pathname.replace('/', '');
    let res = await fetch('/api/' + pageid);
    let content = await res.json();
    return content;
}

function wordSplit(text) {
    let split = [];
    let word = '';
    for (let letter in text) {
        if (punctuation.includes(text[letter])) {
            split.push({ 'word': word, 'punctuation': text[letter] });
            word = '';
        }
        else word += text[letter];
        if (letter == text.length - 1) {
            split.push({ 'word': word, 'punctuation': '' });
            word = '';
        }
    }
    return split;
}

function contentHide(content) {
    for (let element in content.elements) {
        let split = wordSplit(content.elements[element].content);
        split = split.map(i => {
            if (!(punctuation.includes(i.word.toLowerCase()) || commonWords.includes(i.word.toLowerCase()) || wordList.includes(i.word.toLowerCase()))) {
                i.word = '<div class=\'hidden\'>' + '█'.repeat(i.word.length) + '</div>';
            }
            return i;
        });
        text = split.map(i => {
            return i.word + i.punctuation;
        }).join('');
        content.elements[element].contentHidden = text;
    }
    return content;
}

function fillPage(content) {
    let container = document.querySelector('#container');
    container.innerHTML = '';
    for (let element of content.elements) {
        if (element.type === 'h1') {
            let h1 = document.createElement('h1');
            h1.innerHTML = element.contentHidden;
            container.appendChild(h1);
        }
        if (element.type === 'h2') {
            let h2 = document.createElement('h2');
            h2.innerHTML = element.contentHidden;
            container.appendChild(h2);
        }
        else if (element.type === 'h3') {
            let h3 = document.createElement('h3');
            h3.innerHTML = element.contentHidden;
            container.appendChild(h3);
        }
        else if (element.type === 'text') {
            let p = document.createElement('p');
            p.innerHTML = element.contentHidden;
            container.appendChild(p);
        }
    }
}

function revealPage() {
    let container = document.querySelector('#container');
    container.innerHTML = '';
    for (let element of answer.elements) {
        if (element.type === 'h1') {
            let h1 = document.createElement('h1');
            h1.innerHTML = element.content;
            container.appendChild(h1);
        }
        if (element.type === 'h2') {
            let h2 = document.createElement('h2');
            h2.innerHTML = element.content;
            container.appendChild(h2);
        }
        else if (element.type === 'h3') {
            let h3 = document.createElement('h3');
            h3.innerHTML = element.content;
            container.appendChild(h3);
        }
        else if (element.type === 'text') {
            let p = document.createElement('p');
            p.innerHTML = element.content;
            container.appendChild(p);
        }
    }
}

function guess(word) {
    let table = document.querySelector("#guesses-table");
    if (word) {
        if (!(wordList.includes(word) || commonWords.includes(word) || punctuation.includes(word))) {
            word = word.toLowerCase().replace(" ", "");
            wordList.push(word);

            let occ = 0;
            for (element of answer.elements) {
                for (split of wordSplit(element.content)) {
                    if (split.word.toLowerCase() === word.toLowerCase()) {
                        occ++;
                    }
                }
            }
            fillPage(contentHide(answer));
            let th = table.querySelector("#table-head");
            let tr = document.createElement("tr");
            th.parentNode.insertBefore(tr, th.nextSibling);
            let nbTd = document.createElement("td");
            nbTd.innerHTML = wordList.length;
            tr.appendChild(nbTd);
            let wordTd = document.createElement("td");
            wordTd.innerHTML = word;
            tr.appendChild(wordTd);
            let hitsTd = document.createElement("td");
            hitsTd.innerHTML = occ;
            tr.appendChild(hitsTd);
        }
        else if (wordList.includes(word)) {
            alert("Deja fait");
        }
    }
    if(document.querySelector("h1").innerHTML == answer.title) {
        revealPage();
    }
}

console.log("\nEssaye plutôt de trouver par toi même plutôt que d'essayer de tricher 😉\n")

getPageContent().then(content => {
    answer = content;
    fillPage(contentHide(answer));
});

document.querySelector('#button').addEventListener("click", e => {
    guess(document.querySelector('#input').value)
    document.querySelector('#input').value = '';
})

document.querySelector('#input').addEventListener("keypress", e => {
    if (e.key === "Enter") {
        guess(e.target.value)
        e.target.value = '';
    }
})