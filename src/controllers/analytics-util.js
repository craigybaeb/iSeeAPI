const moment = require('moment');

function diffTimes(start, end) {
    const timeDifferenceInSeconds = moment(end).diff(moment(start), 'milliseconds');
    return parseFloat((timeDifferenceInSeconds / 1000).toFixed(1));
}

const nodeMap = {
    "https://www.w3id.org/iSeeOnto/BehaviourTree#GreeterNode": "Greet",
    "https://www.w3id.org/iSeeOnto/BehaviourTree#PersonaQuestionNode": "Persona Selection",
    "https://www.w3id.org/iSeeOnto/BehaviourTree#TargetTypeQuestionNode": "Target type",
    "https://www.w3id.org/iSeeOnto/BehaviourTree#TargetQuestionNode": "Target",
    "https://www.w3id.org/iSeeOnto/BehaviourTree#NeedQuestionNode": "Intent",
    "https://www.w3id.org/iSeeOnto/BehaviourTree#ExplainerNode": "Explainer",
    "https://www.w3id.org/iSeeOnto/BehaviourTree#EvaluationQuestionNode": "Evaluation",
    "https://www.w3id.org/iSeeOnto/BehaviourTree#CompleteNode": "Complete"
}

function evalQuestions(content) {
    const queR = {};
    const dimQ = {};
    const queT = {};
    const execs = content.interaction.executions;

    const evalExecs = execs.filter(exe => exe["https://www.w3id.org/iSeeOnto/BehaviourTreeExecution#enacted"]
        && exe["https://www.w3id.org/iSeeOnto/BehaviourTreeExecution#enacted"]["class"] === "https://www.w3id.org/iSeeOnto/BehaviourTree#EvaluationQuestionNode");

    for (const ev of evalExecs) {
        const gen = ev["http://www.w3.org/ns/prov#generated"]["https://www.w3id.org/iSeeOnto/BehaviourTree#properties"]["https://www.w3id.org/iSeeOnto/BehaviourTree#hasDictionaryMember"];

        const q = gen.filter(g => g["https://www.w3id.org/iSeeOnto/BehaviourTree#pairKey"] === "question")
            .map(g => g["https://www.w3id.org/iSeeOnto/BehaviourTree#pair_value_object"]["content"]);

        const t = gen.filter(g => g["https://www.w3id.org/iSeeOnto/BehaviourTree#pairKey"] === "question")
            .map(g => g["https://www.w3id.org/iSeeOnto/BehaviourTree#pair_value_object"]["responseType"]);

        const d = gen.filter(g => g["https://www.w3id.org/iSeeOnto/BehaviourTree#pairKey"] === "question")
            .map(g => g["https://www.w3id.org/iSeeOnto/BehaviourTree#pair_value_object"]["dimension"]);

        const v = gen.filter(g => g["https://www.w3id.org/iSeeOnto/BehaviourTree#pairKey"] === "variable")
            .map(g => g["https://www.w3id.org/iSeeOnto/BehaviourTree#pair_value_object"]);

        if (q && q[0] && d && d[0] && v && v[0] && t && t[0]){
            if (Array.isArray(v[0])){
                const vals = v[0].map(_v => _v["content"]);
                queR[q[0]] = vals;
            }
            else if (t[0] == 'Number'){
                const min = gen.filter(g => g["https://www.w3id.org/iSeeOnto/BehaviourTree#pairKey"] === "question")
                    .map(g => g["https://www.w3id.org/iSeeOnto/BehaviourTree#pair_value_object"]["validators"]["min"])[0];
                const max = gen.filter(g => g["https://www.w3id.org/iSeeOnto/BehaviourTree#pairKey"] === "question")
                    .map(g => g["https://www.w3id.org/iSeeOnto/BehaviourTree#pair_value_object"]["validators"]["max"])[0];
                const val = v[0]["content"];
                queR[q[0]] = [val, min, max];
            }
            else{
                const vals = [v[0]["content"]];
                queR[q[0]] = vals;
            }
            if (!dimQ[d[0]]) {
                dimQ[d[0]] = [];
            }
            dimQ[d[0]].push(q[0]);
            queT[q[0]] = t[0];
        }
    }

    return [queR, queT, dimQ];
}

function explainers(content) {
    const eCounts = {};
    const nodes = content.interaction.nodes;
    const executions = content.interaction.executions;

    for (const exe of executions) {
        if (exe["https://www.w3id.org/iSeeOnto/BehaviourTreeExecution#enacted"]["class"] !== "https://www.w3id.org/iSeeOnto/BehaviourTree#ExplainerNode") {
            continue;
        }

        const node = nodes.find(n => n.instance === exe["https://www.w3id.org/iSeeOnto/BehaviourTreeExecution#enacted"]["instance"]);

        if (node) {
            const endpoint = node["https://www.w3id.org/iSeeOnto/BehaviourTree#properties"]["https://www.w3id.org/iSeeOnto/BehaviourTree#hasDictionaryMember"]
                .filter(p => p["https://www.w3id.org/iSeeOnto/BehaviourTree#pairKey"] === 'endpoint')
                .map(p => p["https://www.w3id.org/iSeeOnto/BehaviourTree#pair_value_object"]);

            if (endpoint.length > 0) {
                const endpointKey = JSON.stringify(endpoint[0]); // Convert endpoint to a string for use as a key
                eCounts[endpointKey] = (eCounts[endpointKey] || 0) + 1;
            }
        }
    }

    return eCounts;
}


function intentQuestions(content) {
    const qCounts = {};
    const executions = content.interaction.executions;

    for (const exe of executions) {
        if (exe["https://www.w3id.org/iSeeOnto/BehaviourTreeExecution#enacted"]["class"] !== "https://www.w3id.org/iSeeOnto/BehaviourTree#NeedQuestionNode") {
            continue;
        }

        const question = exe["http://www.w3.org/ns/prov#generated"]["https://www.w3id.org/iSeeOnto/BehaviourTree#properties"]["https://www.w3id.org/iSeeOnto/BehaviourTree#hasDictionaryMember"]
            .filter(p => p["https://www.w3id.org/iSeeOnto/BehaviourTree#pairKey"] === 'variable')
            .map(p => p["https://www.w3id.org/iSeeOnto/BehaviourTree#pair_value_object"]["content"]);

        if (question.length > 0 && question[0]) {
            qCounts[question[0]] = (qCounts[question[0]] || 0) + 1;
        }
    }

    return qCounts;
}


function userTimes(content, nodeTypes = null) {
    const times = [];
    const executions = content.interaction.executions;
    const nodes = content.interaction.nodes;

    for (const exe of executions) {
        if (!nodeTypes.includes(exe["https://www.w3id.org/iSeeOnto/BehaviourTreeExecution#enacted"]["class"])) {
            continue;
        }

        let data = null;

        switch (exe["https://www.w3id.org/iSeeOnto/BehaviourTreeExecution#enacted"]["class"]) {
            case "https://www.w3id.org/iSeeOnto/BehaviourTree#ExplainerNode":
                const node = nodes.find(n => n.instance === exe["https://www.w3id.org/iSeeOnto/BehaviourTreeExecution#enacted"]["instance"]);
                if (node) {
                    const endpoint = node["https://www.w3id.org/iSeeOnto/BehaviourTree#properties"]["https://www.w3id.org/iSeeOnto/BehaviourTree#hasDictionaryMember"]
                        .filter(p => p["https://www.w3id.org/iSeeOnto/BehaviourTree#pairKey"] === 'endpoint')
                        .map(p => p["https://www.w3id.org/iSeeOnto/BehaviourTree#pair_value_object"]);
                    if (endpoint.length > 0) {
                        data = JSON.stringify(endpoint[0]);
                    }
                }
                break;

            case "https://www.w3id.org/iSeeOnto/BehaviourTree#NeedQuestionNode":
            case "https://www.w3id.org/iSeeOnto/BehaviourTree#TargetTypeQuestionNode":
            case "https://www.w3id.org/iSeeOnto/BehaviourTree#TargetQuestionNode":
                const dictionaryMember = exe["http://www.w3.org/ns/prov#generated"]["https://www.w3id.org/iSeeOnto/BehaviourTree#properties"]["https://www.w3id.org/iSeeOnto/BehaviourTree#hasDictionaryMember"][1];
                if (dictionaryMember) {
                    data = dictionaryMember["https://www.w3id.org/iSeeOnto/BehaviourTree#pair_value_object"]["content"];
                }
                break;

            case "https://www.w3id.org/iSeeOnto/BehaviourTree#PersonaQuestionNode":
                const personaContent = exe["http://www.w3.org/ns/prov#generated"]["https://www.w3id.org/iSeeOnto/BehaviourTree#properties"]["https://www.w3id.org/iSeeOnto/BehaviourTree#hasDictionaryMember"][1]["https://www.w3id.org/iSeeOnto/BehaviourTree#pair_value_object"]["content"];
                const DOMParser = new (require('xmldom').DOMParser)();
                const parsedXML = DOMParser.parseFromString(personaContent, 'text/xml');
                data = parsedXML.textContent;
                break;

            case "https://www.w3id.org/iSeeOnto/BehaviourTree#EvaluationQuestionNode":
                const content1 = exe["http://www.w3.org/ns/prov#generated"]["https://www.w3id.org/iSeeOnto/BehaviourTree#properties"]["https://www.w3id.org/iSeeOnto/BehaviourTree#hasDictionaryMember"][0]["https://www.w3id.org/iSeeOnto/BehaviourTree#pair_value_object"]["content"];
                const content2 = exe["http://www.w3.org/ns/prov#generated"]["https://www.w3id.org/iSeeOnto/BehaviourTree#properties"]["https://www.w3id.org/iSeeOnto/BehaviourTree#hasDictionaryMember"][1]["https://www.w3id.org/iSeeOnto/BehaviourTree#pair_value_object"]["content"];
                data = content1 + ", " + content2;
                break;

            default:
                break;
        }

        const start = exe["http://www.w3.org/ns/prov#startedAtTime"]["@value"];
        const end = exe["http://www.w3.org/ns/prov#endedAtTime"]["@value"];
        const diff = diffTimes(start, end);

        times.push([exe["https://www.w3id.org/iSeeOnto/BehaviourTreeExecution#enacted"]["class"], diff, data]);
    }

    return times;
}

function intentQuestionsList(contents) {
    const qCountsAgg = {};

    for (const c in contents) {
        const qCounts = intentQuestions(contents[c]);

        for (const q in qCounts) {
            qCountsAgg[q] = (qCountsAgg[q] || 0) + qCounts[q];
        }
    }

    return Object.entries(qCountsAgg).map(([key, value]) => ({
        label: key,
        value: value,
    }));
}


function userTimesList(contents) {
    const nodeTypes = [
        "https://www.w3id.org/iSeeOnto/BehaviourTree#GreeterNode",
        "https://www.w3id.org/iSeeOnto/BehaviourTree#PersonaQuestionNode",
        // "https://www.w3id.org/iSeeOnto/BehaviourTree#TargetTypeQuestionNode",
        "https://www.w3id.org/iSeeOnto/BehaviourTree#TargetQuestionNode",
        "https://www.w3id.org/iSeeOnto/BehaviourTree#NeedQuestionNode",
        "https://www.w3id.org/iSeeOnto/BehaviourTree#ExplainerNode",
        "https://www.w3id.org/iSeeOnto/BehaviourTree#EvaluationQuestionNode"//,
        //"https://www.w3id.org/iSeeOnto/BehaviourTree#CompleteNode"
    ];

    const uTimesAgg = [];

    for (const c in contents) {
        times = userTimes(contents[c], nodeTypes);
        for (const t in times) {
            uTimesAgg.push({
                user: c,
                type: nodeMap[times[t][0]],
                diff: times[t][1],
                data: times[t][2],
                order: t
            });
        }
    }
    return uTimesAgg;
}


function explainersList(contents) {
    const eCountsAgg = {};

    for (const c in contents) {
        const eCounts = explainers(contents[c]);

        for (const e in eCounts) {
            eCountsAgg[e] = (eCountsAgg[e] || 0) + eCounts[e];
        }
    }

    return Object.entries(eCountsAgg).map(([key, value]) => ({
        label: key,
        value: value,
    }));
}


function evalQuestionsList(contents) {
    const dimQC = {};
    for (const c in contents) {
        const [queR, queT, dimQ] = evalQuestions(contents[c]);
        for (const d in dimQ) {
            dimQC[d] = dimQC[d] || {};
            _qs = dimQ[d];
            for (const q in _qs) {
                _q = _qs[q];
                _r = queR[_q];
                _t = queT[_q];
                dimQC[d][_q] = dimQC[d][_q] || {};
                dimQC[d][_q]["type"] = _t;
                
                dimQC[d][_q]["values"] = dimQC[d][_q]["values"] || {};
                
                if (_t === 'Number'){
                    dimQC[d][_q]["values"][_r[0]] = dimQC[d][_q]["values"][_r[0]] || 0;
                    dimQC[d][_q]["values"][_r[0]] = dimQC[d][_q]["values"][_r[0]] + 1;
                    // TODO gauge plot with normalised values
                    // dimQC[d][_q]["values"]["min"] = _r[1];
                    // dimQC[d][_q]["values"]["max"] = _r[2];
                }
                else{
                    for (const i in _r){
                        dimQC[d][_q]["values"][_r[i]] = dimQC[d][_q]["values"][_r[i]] || 0;
                        dimQC[d][_q]["values"][_r[i]] = dimQC[d][_q]["values"][_r[i]] + 1;
                    }
                }
            }
        }
    }
    for (const d in dimQC) {
        dimQC[d] = Object.entries(dimQC[d]).map((prop) => ({
            question: prop[0],
            type: prop[1].type,
            values: Object.entries(prop[1].values).map(([key, value]) => ({
                label: key,
                value: value,
            }))
        }));
    }
    return dimQC;
}


function personasList(contents) {
    const pContentsList = {};
    for (const c in contents) {
        for (const exe of contents[c].interaction.executions) {
            if (exe["https://www.w3id.org/iSeeOnto/BehaviourTreeExecution#enacted"]["class"] === "https://www.w3id.org/iSeeOnto/BehaviourTree#PersonaQuestionNode") {
                const personaContent = exe["http://www.w3.org/ns/prov#generated"]["https://www.w3id.org/iSeeOnto/BehaviourTree#properties"]["https://www.w3id.org/iSeeOnto/BehaviourTree#hasDictionaryMember"][1]["https://www.w3id.org/iSeeOnto/BehaviourTree#pair_value_object"]["content"];
                const DOMParser = new (require('xmldom').DOMParser)();
                const parsedXML = DOMParser.parseFromString(personaContent, 'text/xml');
                const data = parsedXML.getElementsByClassName("persona-name")[0].textContent;
                pContentsList[data] = pContentsList[data] || [];
                pContentsList[data].push(contents[c]);
                break;
            }
        }
    }
    return pContentsList
}

function interactionCounts(contents) {
    const start = moment(contents[contents.length - 1].createdAt);
    const end = moment(contents[0].createdAt);
    let currentDay = moment(start);
    const intCounts = {};
    while (currentDay.isSameOrBefore(end, 'day')) {
        const currentDate = currentDay.format('YYYY-MM-DD');
        const count = contents.filter(item => moment(item.createdAt).isSame(currentDay, 'day')).length;
        intCounts[currentDate] = count;
        currentDay.add(1, 'day');
    }
    return Object.entries(intCounts).map(([key, value]) => ({
        label: key,
        value: value,
    }));
}

function overallExperience(contents) {
    return false;
}

function analytics(contents) {

    const results = {}
    const pContents = personasList(contents);
    results["interactions_per_date"] = interactionCounts(contents);
    results["overall_experience"] = overallExperience(contents);
    results["interactions_per_persona"] = {}
    results["personas"] = {}
    for (const p in pContents) {
        const pContent = pContents[p];
        results["interactions_per_persona"][p] = pContent.length;
        results["personas"][p] = {};
        results["personas"][p]["evaluations"] = evalQuestionsList(pContent);
        results["personas"][p]["intents"] = intentQuestionsList(pContent);
        results["personas"][p]["explainers"] = explainersList(pContent);
        results["personas"][p]["experiences"] = userTimesList(pContent);
    }
    results["interactions_per_persona"] = Object.entries(results["interactions_per_persona"]).map(([key, value]) => ({
        label: key,
        value: value,
    }));
    return results;
}


module.exports = {
    analytics,
};