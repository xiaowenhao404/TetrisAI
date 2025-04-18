const AI = require('./ai.js');
const Grid = require('./grid.js');
const RandomPieceGenerator = require('./random_piece_generator.js');

function Tuner(){
    function randomInteger(min, max){
        return Math.floor(Math.random() * (max - min) + min);
    }

    function normalize(candidate){
        const norm = Math.sqrt(
            candidate.heightWeight ** 2 +
            candidate.linesWeight ** 2 +
            candidate.holesWeight ** 2 +
            candidate.bumpinessWeight ** 2
        );
        candidate.heightWeight /= norm;
        candidate.linesWeight /= norm;
        candidate.holesWeight /= norm;
        candidate.bumpinessWeight /= norm;
    }

    function generateRandomCandidate(){
        const candidate = {
            heightWeight: Math.random() - 0.5,
            linesWeight: Math.random() - 0.5,
            holesWeight: Math.random() - 0.5,
            bumpinessWeight: Math.random() - 0.5
        };
        normalize(candidate);
        return candidate;
    }

    function sortCandidates(candidates){
        candidates.sort((a, b) => b.fitness - a.fitness);
    }

    function computeFitnesses(candidates, numberOfGames, maxNumberOfMoves){
        console.log(`\nComputing fitness for ${candidates.length} candidates, each with ${numberOfGames} games and up to ${maxNumberOfMoves} moves.`);
        for(let i = 0; i < candidates.length; i++){
            const candidate = candidates[i];
            console.log(`\nCandidate ${i+1}/${candidates.length}: weights = ${JSON.stringify(candidate)}`);
            const ai = new AI(candidate);
            let totalScore = 0;

            for(let j = 0; j < numberOfGames; j++){
                let grid = new Grid(22, 10);
                let rpg = new RandomPieceGenerator();
                let workingPieces = [rpg.nextPiece(), rpg.nextPiece()];
                let workingPiece = workingPieces[0];
                let score = 0;
                let moves = 0;

                while(moves < maxNumberOfMoves && !grid.exceeded()){
                    workingPiece = ai.best(grid, workingPieces);
                    while(workingPiece.moveDown(grid));
                    grid.addPiece(workingPiece);
                    score += grid.clearLines();
                    workingPieces.shift();
                    workingPieces.push(rpg.nextPiece());
                    workingPiece = workingPieces[0];
                    moves++;
                }
                totalScore += score;
                console.log(`  Game ${j+1}/${numberOfGames}: moves=${moves}, score=${score}`);
            }

            candidate.fitness = totalScore;
            console.log(`Candidate ${i+1} fitness = ${candidate.fitness}`);
        }
    }

    function tournamentSelectPair(candidates, ways){
        const indices = candidates.map((_, idx) => idx);
        let fittest1 = null, fittest2 = null;
        for(let i = 0; i < ways; i++){
            const idx = indices.splice(randomInteger(0, indices.length), 1)[0];
            if(fittest1 === null || idx < fittest1){
                fittest2 = fittest1;
                fittest1 = idx;
            } else if(fittest2 === null || idx < fittest2){
                fittest2 = idx;
            }
        }
        return [candidates[fittest1], candidates[fittest2]];
    }

    function crossOver(c1, c2){
        const child = {
            heightWeight: c1.fitness * c1.heightWeight + c2.fitness * c2.heightWeight,
            linesWeight:  c1.fitness * c1.linesWeight  + c2.fitness * c2.linesWeight,
            holesWeight:  c1.fitness * c1.holesWeight  + c2.fitness * c2.holesWeight,
            bumpinessWeight: c1.fitness * c1.bumpinessWeight + c2.fitness * c2.bumpinessWeight
        };
        normalize(child);
        return child;
    }

    function mutate(candidate){
        const delta = Math.random() * 0.4 - 0.2;
        switch(randomInteger(0, 4)){
            case 0: candidate.heightWeight += delta; break;
            case 1: candidate.linesWeight  += delta; break;
            case 2: candidate.holesWeight  += delta; break;
            case 3: candidate.bumpinessWeight += delta; break;
        }
    }

    function replaceWorst(candidates, newCands){
        candidates.splice(-newCands.length);
        candidates.push(...newCands);
        sortCandidates(candidates);
    }

    this.tune = function(params){
        const cfg = Object.assign({ population:100, rounds:5, moves:200, maxGenerations:Infinity }, params);
        let candidates = Array.from({ length: cfg.population }, generateRandomCandidate);

        console.log('Computing fitnesses of initial population...');
        computeFitnesses(candidates, cfg.rounds, cfg.moves);
        sortCandidates(candidates);
        console.log(`Initial best fitness: ${candidates[0].fitness}, weights: ${JSON.stringify(candidates[0])}`);

        let generation = 0;
        while(generation < cfg.maxGenerations){
            console.log(`\n=== Generation ${generation+1} ===`);
            const newCandidates = [];
            const survivors = Math.floor(cfg.population * 0.7);
            for(let k = survivors; k < cfg.population; k++){
                const [p1, p2] = tournamentSelectPair(candidates, Math.floor(cfg.population * 0.1));
                let child = crossOver(p1, p2);
                if(Math.random() < 0.05) mutate(child);
                normalize(child);
                newCandidates.push(child);
            }
            console.log(`Computing fitnesses of ${newCandidates.length} new candidates...`);
            computeFitnesses(newCandidates, cfg.rounds, cfg.moves);
            replaceWorst(candidates, newCandidates);
            console.log(`After gen ${generation+1}: best fitness=${candidates[0].fitness}, weights=${JSON.stringify(candidates[0])}`);
            generation++;
        }
    };
}

module.exports = Tuner;
