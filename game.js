const MAP_WIDTH = 20;
const MAP_HEIGHT = 20;
const SIZE_CONST = 3;
const EDGE_CONST = 2;

const WHITESPACE = "&nbsp;";
// const WHITESPACE = "-";

function getRandomNumber(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

class Game {
    constructor() {
        this._title = $("#title");
        this._playButton = $("#playButton");
        this._game = $("#game");
        this._alerts = $("#alerts");

        this._onStart = this._onStart.bind(this);
        this._loadGame = this._loadGame.bind(this);
        this._playerMove = this._playerMove.bind(this);
        this._goToSleep = this._goToSleep.bind(this);
        this._tryOpenDoor = this._tryOpenDoor.bind(this);

        this._playButton.click(this._onStart);

        this._keyCodes = {
            "ArrowLeft": [-1, 0],
            "ArrowUp": [0, -1],
            "ArrowRight": [1, 0],
            "ArrowDown": [0, 1]
        };

        this._tiles =
        {
            "*": {
                state: "solid",
                interact: () => {
                    return;
                }
            },
            "&nbsp;": {
                state: "solid",
                interact: () => {
                    return;
                }
            },
            "b": {
                state: "opaque",
                interact: () => {
                    this._sleep();
                }
            },
            "d": {
                state: "opaque",
                interact: (x, y) => {
                    this._openDoor(x, y);
                }
            },
            "m": {
                state: "solid",
                interact: (x, y) => {
                    this._getMelatonin(x, y);
                }
            }
        }
        // TODO replace mapGrid w graph?
        this._mapGrid = new MapGrid();
        this._world = new World();

        // _worldSize is approximated to ln(this._weirdness)
        this._worldSize = 2 + Math.pow(Math.E, Math.random()) * this._weirdness;
        this._worldNumOfEdges =
        // this._worldSize = this._weirdness * Math.floor(Math.random() * (SIZE_CONST + 1)) + 2;
        // this._worldNumOfEdges = this._weirdness * Math.floor(Math.random() * (EDGE_CONST + 1)) + 2;

        this._melatoninFound = 0;
        this._totalMelatonin = 0;
        this._numOfItems = 0;
        this._weirdness = 0;

        this._door = null;
        this._currMap = null;
    }
    _onStart(event) {
        event.preventDefault();
        this._title.fadeOut("slow").promise().done(() => {
            this._loadGame();
        });
    }
    _loadGame() {
        this._currMap = new Bedroom(1);
        this._mapGrid.createGrid(this._currMap.html);
        this._player = new Player(this._mapGrid);
        this._createMap();
        let alertMessage = `<h3>Use ARROW KEYS to move</h3>`;
        this._alerts.append($(alertMessage)),
            document.addEventListener("keydown", this._playerMove);
    }
    _playerMove(event) {
        event.preventDefault();
        if (this._keyCodes.hasOwnProperty(event.code)) {
            if (this._alerts.html() !== "") {
                this._alerts.html("");
            }
            let direction = this._keyCodes[event.code];
            this._player.oldPos = this._player.pos;
            let newPos = [this._player.x + direction[0], this._player.y + direction[1]];
            let tile = this._mapGrid.getTile(newPos);
            if (tile.type in this._tiles) {
                this._tiles[tile.type].interact(tile.x, tile.y);
            } else {
                this._player.x += direction[0];
                this._player.y += direction[1];
                this._player.pos = [this._player.x, this._player.y];
            }
            this._createMap();
        }
    }
    /* Core functionality of the game */
    _createWorld() {
        this._world.removeAllVertices();
        this._melatoninFound = 0;
        if (this._weirdness !== 0) {
            for (let i = 0; i < this._worldSize; i++) {
                let map = new Map(i);
                this._world.addVertex(map);
            }
            let bedroom = new Bedroom(this._worldSize);
            this._world.randomlyAddEdges();
            this._world.addVertex(bedroom);
            let randomVertex = this._world.getRandomVertex();
            while (randomVertex === bedroom) {
                randomVertex = this._world.getRandomVertex();
            }
            this._world.addEdge(bedroom, randomVertex);
            this._addDoors();
            this._currMap = bedroom;
            this._player.changeCoords(9, 2);
            this._totalMelatonin += 1 * Math.ceil(Math.random(0, 1));
            this._numOfItems += 1 * Math.ceil(Math.random(0, 1));
            this._populateWorld();
            this._createMap();
        }
    }
    _populateWorld() {
        this._addMelatonin();
        this._addItems();
        this._addEnemies();
    }
    _addMelatonin() {
        let melatoninAdded = 0;
        while (melatoninAdded < this._totalMelatonin) {
            let randomMap = this._world.getRandomVertex();
            if (randomMap.addItem("m") === true) {
                melatoninAdded += 1;
            }
        }
    }
    _addItems() {
        let itemsAdded = 0;
        while (itemsAdded < this._numOfItems) {
            let randomMap = this._world.getRandomVertex();
            if (getRandomNumber(0, 1) === 0) {
                // generate weapon
                // let numOfAttributes = Math.floor(this._weirdness * Math.random(0, 1));
                // for (let i = 0; i < numOfAttributes; i++) {
                //     weapon.addAttribute();
                // }
                if (randomMap.addItem("w") === true) {
                    itemsAdded += 1
                }
            } else {
                if (randomMap.addItem("a") === true) {
                    itemsAdded += 1
                }
            }
        }
    }
    _generateWeapon() {


    }
    _addEnemies() {

    }
    _getMelatonin(x, y) {
        this._melatoninFound += 1;
        let alertMessage = `<h3>${this._melatoninFound} out of ${this._totalMelatonin} melatonin found</h3>`;
        this._alerts.html($(alertMessage));
        this._currMap.html[y][x] = ".";
    }
    _addDoors() {
        for (let key of Object.keys(this._world.vertices)) {
            let map = this._world.vertices[key];
            let adjacents = this._world.adjacencyList[map.id];
            for (let adjacent of adjacents) {
                let adjacentMap = this._world.vertices[adjacent];
                let door = new Door(map, adjacentMap);
            }
        }
    }
    _createMap() {
        let newMap = [];
        let y = 0;
        for (let row of this._currMap.html) {
            let newRow = "";
            let x = 0;
            for (let space of row) {
                if (this._player.x === x && this._player.y === y) {
                    newRow += 'X';
                } else if (this._player.oldPos[0] === x && this._player.oldPos[1] === y) {
                    newRow += '.';
                    // } else if (this._currMap.door[0] === x && this._currMap.door[1] === y) {

                } else {
                    newRow += space;
                }
                x += 1;
            }
            newMap.push(newRow);
            y += 1;
        }
        this._drawMap(newMap);
        this._mapGrid.createGrid(this._currMap.html);
    }
    _drawMap(map) {
        let newMapString = "";
        $.each(map, function (index, string) {
            newMapString += string + "<br/>";
        });
        this._game.html(newMapString);
    }
    _sleep() {
        this._alertMessage("sleep");
        document.addEventListener("keydown", this._goToSleep);
    }
    _goToSleep(event) {
        if (event.code === 'Space' || event.key === ' ' || event.keyCode === 32) {
            if (this._weirdness > 0 && this._melatoninFound < this._totalMelatonin) {
                let alertMessage = `<h3>You are not sleepy. Find melatonin to go to sleep</h3>`;
                this._alerts.html($(alertMessage));
                return;
            }
            this._game.fadeOut("slow").promise().done(() => {
                this._alerts.html("");
                this._weirdness += 1;
                this._updateWorldProperties();
                this._createWorld();
                this._game.fadeIn("slow");
            });
        } else if (event.code === "ArrowLeft" || event.code === "ArrowRight"
            || event.code === "ArrowUp" || event.code === "ArrowDown") {
            this._alerts.html("");
            document.removeEventListener('keydown', this._goToSleep);
        }
    }
    _updateWorldProperties() {
        this._worldSize = this._weirdness * Math.floor(Math.random() * (SIZE_CONST + 1)) + 3;
        this._worldNumOfEdges = this._weirdness * Math.floor(Math.random() * (EDGE_CONST + 1)) + 3;
    }
    _openDoor(x, y) {
        this._door = this._findDoor(y, x);
        this._alertMessage("open door");
        document.addEventListener("keydown", this._tryOpenDoor);
    }
    _findDoor(x, y) {
        return this._currMap.doors[[x, y]];
    }
    _tryOpenDoor(event) {
        if (event.code === 'Space' || event.key === ' ' || event.keyCode === 32) {
            if (this._weirdness === 0) {
                let alertMessage = `<h3>Door is locked</h3>`;
                this._alerts.html($(alertMessage));
            } else {
                let oppositeDoor = this._findOppositeDoor();
                this._currMap = this._door.dest;
                this._player.y = oppositeDoor.x;
                this._player.x = oppositeDoor.y;
                this._createMap();
            }
        } else if (event.code === "ArrowLeft" || event.code === "ArrowRight"
            || event.code === "ArrowUp" || event.code === "ArrowDown") {
            this._alerts.html("");
            document.removeEventListener('keydown', this._tryOpenDoor);
        }
    }
    _findOppositeDoor() {
        for (let key of Object.keys(this._door.dest.doors)) {
            let door = this._door.dest.doors[key];
            if (door.dest === this._currMap) {
                return door;
            }
        }
    }
    _alertMessage(message) {
        let alertMessage = `<h3>Press SPACEBAR to ${message}</h3>`;
        let html = this._alerts.html();
        if (html !== alertMessage) {
            this._alerts.append($(alertMessage));
        }
    }
}

// MapGrid is the
class MapGrid {
    constructor() {
        this.height = MAP_HEIGHT;
        this.width = MAP_WIDTH;
        this.tiles = {}
    }
    createGrid(map) {
        let y = 0;
        for (let row of map) {
            let x = 0;
            for (let space of row) {
                this.tiles[[x, y]] = new Tile(x, y, space);
                x += 1;
            }
            y += 1;
        }
    }
    getTile(coords) {
        return this.tiles[coords];
    }
    changeKey(oldX, oldY, newX, newY, tile) {
        this.tiles[[newX, newY]] = tile;
        delete this.tiles[[oldX, oldY]];
    }
}

class Tile {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type;
    }
}

class Player extends Tile {
    constructor(grid) {
        super();
        this.x = 8;
        this.y = 1;
        this.pos = [this.x, this.y];
        this.oldPos = [-1, -1];
        this._grid = grid;
    }
    changeCoords(newX, newY) {
        this._grid.changeKey(this.x, this.y, newX, newY, this);
        this.x = newX;
        this.y = newY;
    }
}

class Item {
    constructor(type) {
        this.type = type;
    }
    pickUp() {

    }
}

class Weapon extends Item {
    constructor() {
        super();
        this.type = "w";
        this.attribs = [];
    }
    addAttribute() {

    }
}

class Vertex {
    constructor(id) {
        this.id = id;
        this.html = [];
        this.tiles = {};
    }
}

class Room extends Vertex {
    constructor(id) {
        super();
        this.id = id;
        this._height = getRandomNumber(5, 15);
        this._width = getRandomNumber(5, 15);

        this.corners = {
            topLeft: null,
            topRight: null,
            bottomLeft: null,
            bottomRight: null
        }

        this.coords = [];
        this.generateRoom();
    }
    generateRoom() {
        this.tiles = {};
        this._generateCorners();
        this._generateWalls();
        this._generateInterior();
    }
    _generateCorners() {
        this.corners.topLeft = {
            x: getRandomNumber(0, MAP_HEIGHT - 10),
            y: getRandomNumber(0, MAP_WIDTH - 10)
        };
        let height = getRandomNumber(5, 8);
        let width = getRandomNumber(3, 5);
        this.corners.topRight = {
            x: this.corners.topLeft.x + width,
            y: this.corners.topLeft.y
        };
        this.corners.bottomLeft = {
            x: this.corners.topLeft.x,
            y: this.corners.topLeft.y + height
        };
        this.corners.bottomRight = {
            x: this.corners.topLeft.x + width,
            y: this.corners.topLeft.y + height
        };
        this.xMin = this.corners.topLeft.x;
        this.yMin = this.corners.topLeft.y;
        this.xMax = this.corners.topRight.x;
        this.yMax = this.corners.bottomLeft.y;
        for (let key in this.corners) {
            let corner = this.corners[key];
            this.tiles[[corner.x, corner.y]] = new Tile(corner.x, corner.y, "*");
        }
    }
    _generateWalls() {
        for (let i = this.xMin; i < this.xMax; i++) {
            this.tiles[[i, this.yMin]] = new Tile(i, this.yMin, "*");
            this.tiles[[i, this.yMax]] = new Tile(i, this.yMax, "*");
        }
        for (let i = this.yMin; i < this.yMax; i++) {
            this.tiles[[this.xMin, i]] = new Tile(this.xMin, i, "*");
            this.tiles[[this.xMax, i]] = new Tile(this.xMax, i, "*");
        }
    }
    _generateInterior() {
        for (let i = this.xMin + 1; i < this.xMax; i++) {
            for (let j = this.yMin + 1; j < this.yMax; j++) {
                this.tiles[[i, j]] = new Tile(i, j, ".");
            }
        }
    }
}

class Graph {
    constructor() {
        this.vertices = {};
        this.adjacencyList = {};
        this.dfs = this.dfs.bind(this);
    }

    addVertex(vertex) {
        this.vertices[vertex.id] = vertex;
        this.adjacencyList[vertex.id] = [];
    }

    addEdge(vertex1, vertex2) {
        this.adjacencyList[vertex1.id].push(vertex2.id);
        this.adjacencyList[vertex2.id].push(vertex1.id);
    }
    printGraph() {
        for (let vertex of Object.keys(this.vertices)) {
            const neighbors = this.adjacencyList[vertex].join(", ");
            console.log(`${vertex} -> ${neighbors}`);
        }
    }
    removeAllVertices() {
        this.vertices = {};
        this.adjacencyList = {};
    }
    randomlyAddEdges() {
        const numEdges = Math.floor(Math.random() * (Object.keys(this.vertices).length - 1));
        for (let i = 0; i < numEdges; i++) {
            let v1 = this.getRandomVertex();
            let v2 = this.getRandomVertex();
            if (v1 !== v2 && !this.adjacencyList[v1.id].includes(v2.id)) {
                this.addEdge(v1, v2);
            }
        }
        let connectedComponents = this.getConnectedComponents();
        if (connectedComponents.length > 1) {
            this.connectUnconnectedVertices(connectedComponents);
        }
    }
    connectUnconnectedVertices(connectedComponents) {
        let i = 0;
        let currComponent = connectedComponents[i];
        for (let i = 0; i < connectedComponents.length - 1; i++) {
            let randomVertex1 = this.vertices[currComponent[getRandomNumber(0, currComponent.length - 1)]];
            let nextComponent = connectedComponents[i + 1];
            let randomVertex2 = this.vertices[nextComponent[getRandomNumber(0, nextComponent.length - 1)]];
            currComponent = nextComponent;
            this.addEdge(randomVertex1, randomVertex2);
        }
    }
    getRandomVertex() {
        const randomIndex = Math.floor(Math.random() * Object.keys(this.vertices).length);
        let randomKey = Object.keys(this.vertices)[randomIndex];
        return this.vertices[randomKey];
    }
    getConnectedComponents() {
        const visited = {};
        const connectedComponents = [];
        for (let vertex of Object.keys(this.vertices)) {
            if (!visited[vertex]) {
                const component = [];
                this.dfs(vertex, visited, component);
                connectedComponents.push(component);
            }
        }
        return connectedComponents;
    }
    dfs(vertex, visited, component) {
        visited[vertex] = true;
        component.push(vertex);
        for (let neighbor of this.adjacencyList[vertex]) {
            if (!visited[neighbor]) {
                this.dfs(neighbor, visited, component);
            }
        }
    }
    bfs(startVertex) {
        const visited = {};
        const queue = [];
        visited[startVertex] = true;
        queue.push(startVertex);
        while (queue.length > 0) {
            const currentVertex = queue.shift();
            console.log(currentVertex);
            const adjacentVertices = this.adjacencyList[currentVertex];
            for (let i = 0; i < adjacentVertices.length; i++) {
                const neighbor = adjacentVertices[i];
                if (!visited[neighbor]) {
                    visited[neighbor] = true;
                    queue.push(neighbor);
                }
            }
        }
    }
}

class World extends Graph {
    constructor() {
        super();
    }
}

class Map extends Graph {
    constructor(id) {
        super();
        this.id = id;
        this._height = MAP_HEIGHT;
        this._width = MAP_WIDTH;
        this.html = [];
        this.items = {};
        this.doors = {};
        this.generateMap();
    }
    drawDoor(door) {
        let randomRoom = this.getRandomVertex();
        if (getRandomNumber(0, 1) === 0) {
            if (getRandomNumber(0, 1) === 0) {
                door.x = randomRoom.xMin;
            } else {
                door.x = randomRoom.xMax;
            }
            door.y = getRandomNumber(randomRoom.yMin + 2, randomRoom.yMax - 1);
        } else {
            if (getRandomNumber(0, 1) === 0) {
                door.y = randomRoom.yMin;
            } else {
                door.y = randomRoom.yMax;
            }
            door.x = getRandomNumber(randomRoom.xMin + 2, randomRoom.xMax - 1);
        }
        if (this.html[door.x][door.y] === "." || [door.x, door.y] in this.doors) {
            this.drawDoor(door);
        }
        this.doors[[door.x, door.y]] = door;
        this.html[door.x][door.y] = "d";
    }
    //For debugging
    mapDebug() {
        result = [];
        for (let i = 0; i < MAP_HEIGHT; i++) {
            let string = "";
            for (let j = 0; j < MAP_WIDTH; j++) {
                string += this.html[j][i];
            }
        }
        console.log(result);
    }
    generateMap() {
        this._generateRooms();
        this.randomlyAddEdges();
        for (let i = 0; i < MAP_HEIGHT; i++) {
            this.html.push([]);
            for (let j = 0; j < MAP_WIDTH; j++) {
                // if (this._isInVertices(j, i)) {
                //     this.html[i].push("*");
                // } else {
                //     this.html[i].push(".");
                // }
                this.html[i].push(WHITESPACE);
            }
        }
        for (let key of Object.keys(this.vertices)) {
            let room = this.vertices[key];
            for (let coords of Object.keys(room.tiles)) {
                let tile = room.tiles[coords];
                this.html[tile.x][tile.y] = tile.type;
            }
        }
        this._generatePaths();
    }
    _isInVertices(x, y) {
        for (let key of Object.keys(this.vertices)) {
            let vertex = this.vertices[key];
            for (let corner in vertex.corners) {
                if (vertex.corners[corner].x === x && vertex.corners[corner].y === y) return true;
            }
        }
        return false;
    }
    _generateRooms() {
        let numOfRooms = Math.floor(Math.random() * 5) + 3;
        for (let i = 0; i < numOfRooms; i++) {
            let room = new Room(i);
            let counter = 0;
            while (this._isAllowedLocation(room) !== true) {
                room.generateRoom();
                if (counter >= 50) {
                    return;
                }
                counter++;
            }
            this.addVertex(room);
        }
    }
    _isAllowedLocation(room1) {
        let result = true;
        for (let key of Object.keys(this.vertices)) {
            let room2 = this.vertices[key];
            if (this._overlaps(room1, room2) ||
                this._overlaps(room2, room1)) {
                result = false;
                break;
            }
        }
        return result;
    }
    _overlaps(room1, room2) {
        for (let corner in room1.corners) {
            if (
                room1.corners[corner].x >= room2.corners.bottomLeft.x - 1 &&
                room1.corners[corner].x <= room2.corners.bottomRight.x + 1 &&
                room1.corners[corner].y >= room2.corners.topLeft.y - 1 &&
                room1.corners[corner].y <= room2.corners.bottomLeft.y + 1
            ) {
                return true;
            }
        }
        return false;
    }
    // Find pt in r1 closest to r2; then greedily create path
    _generatePaths() {
        let drawnEdges = {};
        for (let key of Object.keys(this.vertices)) {
            let room = this.vertices[key];
            for (let adjacent of this.adjacencyList[room.id]) {
                let sorted = [room.id, adjacent].sort((a, b) => a - b);
                if (drawnEdges[sorted] !== true) {
                    this._generatePath(room, this.vertices[adjacent]);
                    drawnEdges[sorted] = true;
                }

            }
        }
    }
    _generatePath(room1, room2) {
        let startWithY = false;
        let p1 = {
            x: getRandomNumber(room1.xMin + 3, room1.xMax - 3),
            y: getRandomNumber(room1.yMin + 3, room1.yMax - 3)
        };
        let p2 = {
            x: getRandomNumber(room2.xMin + 3, room2.xMax - 3),
            y: getRandomNumber(room2.yMin + 3, room2.yMax - 3)
        };

        // this._iter = 0;
        // if (this._iter === 0) {
        //     this.html[p2.x][p2.y] = "d";
        // }
        // this._iter += 1;

        if (getRandomNumber(0, 1) === 1) {
            startWithY = true;
        }
        let path = [];
        if (startWithY === true) {
            if (this._changeY(p1, p2, path) === false ||
                this._changeX(p1, p2, path) === false) {
                this._generatePath(room1, room2);
            }
        } else {
            if (this._changeX(p1, p2, path) === false ||
                this._changeY(p1, p2, path) === false) {
                this._generatePath(room1, room2);
            }
        }
        this._drawPath(path);
    }
    _drawPath(path) {
        for (let px of path) {
            this.html[px[0]][px[1]] = ".";
        }
    }
    _changeX(p1, p2, path) {
        while (p1.x < p2.x) {
            p1.x += 1;
            path.push([p1.x, p1.y]);
        }
        while (p1.x > p2.x) {
            p1.x -= 1;
            path.push([p1.x, p1.y]);
        }
        // return this._checkPath(path);
    }
    _changeY(p1, p2, path) {
        while (p1.y < p2.y) {
            p1.y += 1;
            path.push([p1.x, p1.y]);
        }
        while (p1.y > p2.y) {
            p1.y -= 1;
            path.push([p1.x, p1.y]);
        }
    }
    _checkPath(path) {
        for (let i = 0; i < path.length; i++) {
            if (this.html[path[i][0]][path[i][1]] === "*" && i < path.length - 1) {
                if (this.html[path[i + 1][0]][path[i + 1][1]] === "*") {
                    return false;
                }
            }
        }
        return true;
    }
    addItem(item) {
        let randomRoom = this.getRandomVertex();
        let x = getRandomNumber(randomRoom.xMin + 1, randomRoom.xMax - 1);
        let y = getRandomNumber(randomRoom.yMin + 1, randomRoom.yMax - 1);
        // this.items[[x, y]] = item;
        this.html[x][y] = item;
        return true;
    }
}

class Bedroom extends Map {
    constructor(id) {
        super();
        this.id = id;
        this._isBedroom = true;
        this.html = [
            ["*", "*", "*", "*", "*", "*", "*", "*", "*", "*", "*"],
            ["*", ".", ".", ".", ".", ".", ".", ".", ".", "b", "*"],
            ["*", ".", ".", ".", ".", ".", ".", ".", ".", ".", "*"],
            ["*", ".", ".", ".", ".", ".", ".", ".", ".", ".", "*"],
            ["*", "*", "*", "*", "*", "d", "*", "*", "*", "*", "*"],
        ];
    }
    drawDoor(door) {
        door.x = 4;
        door.y = 5;
        this.doors[[door.x, door.y]] = door;
    }
    generateMap() {
        return;
    }
    addItem() {
        return false;
    }
}

class Door extends Tile {
    constructor(src, dest) {
        super()
        this.src = src;
        this.dest = dest;
        this.src.drawDoor(this);
    }
}

let game = new Game();