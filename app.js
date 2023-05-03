let express = require("express");
let obj = express();
obj.use(express.json());
let { open } = require("sqlite");
let sqlite3 = require("sqlite3");
let path = require("path");
let dbpath = path.join(__dirname, "cricketMatchDetails.db");
let db = null;

let converSankeToCamel = (object) => {
  return {
    playerId: object.player_id,
    playerName: object.player_name,
  };
};

let disconverSankeToCamel = (object) => {
  return {
    matchId: object.match_id,
    match: object.match,
    year: object.year,
  };
};

let initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbpath,
      driver: sqlite3.Database,
    });
    obj.listen(3000, () => {
      console.log("Server initialized at localhost:3000/");
    });
  } catch (e) {
    console.log(e.message);
    process.exit(1);
  }
};
initializeDbAndServer();

//get
obj.get("/players/", async (request, Response) => {
  let getQueury = `
        SELECT 
            *
        FROM 
            player_details;
    `;
  let resultpromise = await db.all(getQueury);
  let result = [];
  for (let item of resultpromise) {
    let converted = converSankeToCamel(item);
    result.push(converted);
  }
  Response.send(result);
});

//getone
obj.get("/players/:playerId/", async (request, Response) => {
  let { playerId } = request.params;
  let getQueury = `
        SELECT 
            player_id AS playerId,
            player_name AS playerName
        FROM 
            player_details
        WHERE
            player_id = ${playerId};    
    `;
  let resultpromise = await db.get(getQueury);

  Response.send(resultpromise);
});

//getdisone
obj.get("/matches/:matchId/", async (request, Response) => {
  let { matchId } = request.params;
  let getQueury = `
        SELECT 
            *
        FROM 
            match_details
        WHERE
            match_id = ${matchId};    
    `;
  let resultpromise = await db.get(getQueury);
  let result = disconverSankeToCamel(resultpromise);

  Response.send(result);
});

//put

obj.put("/players/:playerId/", async (request, Response) => {
  let { playerName } = request.body;
  let { playerId } = request.params;
  let updateQuery = `
       UPDATE player_details
       SET
            player_name = '${playerName}'
       WHERE player_id = ${playerId};
    `;
  await db.run(updateQuery);
  Response.send("Player Details Updated");
});

//get
obj.get("/matches/:matchId/players", async (request, Response) => {
  let { matchId } = request.params;
  let getQueury = `
        SELECT 
            player_details.player_id AS playerId,
            player_details.player_name AS playerName
        FROM 
            player_details NATURAL JOIN player_match_score 
        WHERE
            match_id = ${matchId};    
    `;
  let stateIdRes = await db.all(getQueury);

  Response.send(stateIdRes);
});

//get
obj.get("/players/:playerId/matches", async (request, Response) => {
  let { playerId } = request.params;
  let getQueury = `
        SELECT 
            match_details.match_id AS matchId,
            match_details.match,
            match_details.year
        FROM 
            match_details INNER JOIN player_match_score ON match_details.match_id = player_match_score.match_id
        WHERE
            player_match_score.player_id = ${playerId};    
    `;
  let stateIdRes = await db.all(getQueury);

  Response.send(stateIdRes);
});

obj.get("/players/:playerId/playerScores", async (request, response) => {
  let { playerId } = request.params;
  const getPlayerScored = `
    SELECT
        player_details.player_id AS playerId,
        player_details.player_name AS playerName,
        SUM(player_match_score.score) AS totalScore,
        SUM(fours) AS totalFours,
        SUM(sixes) AS totalSixes 
    FROM 
        player_details INNER JOIN player_match_score ON
        player_details.player_id = player_match_score.player_id
    WHERE 
        player_details.player_id = ${playerId};
    `;

  let res = db.get(getPlayerScored);
  response.send(res);
});
module.exports = obj;
