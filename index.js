/** The following algorithm is the implementation of Fisher-Yates
 * By coolaj86
 * From https://stackoverflow.com/questions/2450954/how-to-randomize-shuffle-a-javascript-array
 */
function shuffle(array) {
    let currentIndex = array.length, randomIndex;

    // While there remain elements to shuffle...
    while (currentIndex != 0) {

        // Pick a remaining element...
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;

        // And swap it with the current element.
        [array[currentIndex], array[randomIndex]] = [
            array[randomIndex], array[currentIndex]];
    }

    return array;
}


function load_data() {
    let request = new Request("webs.json")
    return fetch(request)
}

function choose_web_index() {
    let now = new Date
    let today = new Date(now.getFullYear(), now.getMonth(), now.getDay())
    let date_as_number = Number(today) / (60 * 60 * 24 * 1000)
    return date_as_number -2
}

function Response(word, accepted, score = 0) {
    this.word = word
    this.accepted = accepted
    this.score = score
}

function ChainInfo(word, chain) {
    this.word = word
    this.chain = chain
    this.pretty_chain = pretty_print_chain(chain)
}

function pretty_print_chain(chain) {
    link = /-\(([\w ]+)\)->/
    segments = chain.split(link)
    withClasses = "<ul>"
    for (let i = 0; i < segments.length; i += 2) {
        withClasses += `<li><span class="definition">${segments[i]}</span>`
        if (i < segments.length - 1) {
            withClasses += `<span class="link">${segments[i + 1]}</span>`
        }
        withClasses += "</li>"
    }
    withClasses += "</ul>"
    return withClasses
}

function Game() {
    this.loaded = false
    this.load = function (webs) {
        let web = webs[choose_web_index() % webs.length]
        web.forEach(wd => this.web[wd.w] = wd)
        this.words = shuffle(web.map(wd => wd.w))
        this.loaded = true
    }
    this.web = {}
    this.words = []
    this.ended = false
    this.response = new Response("", false)
    this.info = new ChainInfo("", "")

    this.emojiOutcome = function () {
        if (!this.ended) {
            return ""
        }
        let score = ""
        switch (this.response.score) {
            case 0:
                score = "⬜🪰"
                break;
            case 50:
                score = "🟦🪰"
                break;
            case 100:
                score = "🟪🕷"
                break;
        }
        return score
    }
    this.copyOutcome = function () {
        text = this.emojiOutcome()
        navigator.clipboard.writeText(text);
    }
    this.guess = function (attempt) {
        if (!this.loaded) {
            this.response = new Response(attempt, false)
            return
        }
        if (this.web[attempt] === undefined) {
            this.response = new Response(attempt, false)
            return
        }
        if (!this.ended) {
            this.ended = true
            score = 100 * this.web[attempt].s / 2
            description = this.web[attempt].d
            this.response = new Response(attempt, true, score)
        }
        this.info = new ChainInfo(attempt, this.web[attempt].d)
        this.refreshUI()
    }

    this.refreshUI = function () {

        let gameBoard = document.getElementById("board")
        gameBoard.innerHTML = ""

        if (this.ended) {
            let gameEndedBanner = document.createElement("div")
            let yourGuessP = document.createElement("p")
            yourGuessP.innerHTML = `Your guess: <span class="word">${this.response.word}</span>`
            let yourScoreP = document.createElement("p")
            yourScoreP.innerHTML = `Your score: ${this.response.score}%`


            let copyForm = document.createElement("form")
            copyForm.setAttribute("action", "#")
            copyForm.addEventListener("submit", event => {
                this.copyOutcome()
                event.preventDefault()
            })

            let copyButton = document.createElement("input")
            copyButton.setAttribute("id", "copyButton")
            copyButton.setAttribute("type", "submit")
            copyButton.setAttribute("value", "Copy Score")
            copyButton.setAttribute("tabindex", "0")

            copyForm.appendChild(copyButton)

            gameEndedBanner.innerHTML = ""
            gameEndedBanner.appendChild(yourGuessP)
            gameEndedBanner.appendChild(yourScoreP)
            gameEndedBanner.appendChild(copyForm)
            gameEndedBanner.classList.add("centerBlock", "gameEndedBanner")

            gameBoard.appendChild(gameEndedBanner)


            let explanationP = document.createElement("p")
            explanationP.innerHTML = `Shortest chain for <span class="word">${this.info.word}</span>: ` + this.info.pretty_chain
            let explanation = document.getElementById("chainInfo")
            explanation.innerHTML = ""
            explanation.appendChild(explanationP)

        }

        let wordGrid = document.createElement("div")
        wordGrid.classList.add("wordGrid")

        this.words.forEach(word => {
            let node = document.createElement("div")
            node.classList.add("word")
            if (this.ended) {
                switch (this.web[word].s) {
                    case 0:
                        node.classList.add("far")
                        break;
                    case 1:
                        node.classList.add("near")
                        break;
                    case 2:
                        node.classList.add("exact")
                        break;
                }
            } else {
                node.classList.add("unguessed")
            }
            node.innerHTML = word
            wordGrid.appendChild(node)
            node.addEventListener("click", () => this.guess(word))
        }
        )
        gameBoard.appendChild(wordGrid)
    }
}

let g = new Game()

function start() {
    load_data().then(function (response) {
        if (response.ok) { return response.json() }
        else {
            throw "Could not load word data."
        }
    }).then(json => {
        g.load(json)
        g.refreshUI()
    })
}


document.addEventListener("load", start)
start()