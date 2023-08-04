const MAP_WIDTH = 20;
const MAP_HEIGHT = 20;

const BEDROOM_HEIGHT = 5;
const BEDROOM_WIDTH = 11;

const SIZE_CONST = 3;
const EDGE_CONST = 2;

const PLAYER_START = {
    x: 5,
    y: 2
};
const BEDROOM_DOOR = {
    x: 5,
    y: 4
};
const BED_POSITION = {
    x: 9,
    y: 1
};

const WHITESPACE = "&nbsp;";
// const WHITESPACE = "-";

function getRandomNumber(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function logTransformation(x) {
    return Math.pow(Math.E, Math.random()) * x;
}

class Game {
    constructor() {
        this._title = $("#title");
        this._game = $("#game");
        this._playButton = $("#playButton");
        this._content = $("#content");
        this._map = $("#map");
        this._alerts = $("#alerts");
        this._inventory = $("#inventory");
        this._inventorySpaces = $("#inventorySpaces");
        this._inventoryButton = $("#inventoryButton");
        this._selectedItem = $("#selectedItem");

        this._onStart = this._onStart.bind(this);
        this._loadGame = this._loadGame.bind(this);
        this._playerMove = this._playerMove.bind(this);
        this._goToSleep = this._goToSleep.bind(this);
        this._tryOpenDoor = this._tryOpenDoor.bind(this);
        this._openInventory = this._openInventory.bind(this);
        this._closeInventory = this._closeInventory.bind(this);
        this._displayItem = this._displayItem.bind(this);
        this._removeItem = this._removeItem.bind(this);

        this._isInventoryOpen = false;

        this._inventoryButton.click(this._openInventory);
        this._playButton.click(this._onStart);

        this._keyCodes = {
            "ArrowLeft": [-1, 0],
            "ArrowUp": [0, -1],
            "ArrowRight": [1, 0],
            "ArrowDown": [0, 1]
        };
        this._weaponTypes =
        {
            "wood": {
                rarity: 0.5,
                damage: 2
            },
            "stone": {
                rarity: 0.2,
                damage: 4
            },
            "iron": {
                rarity: 0.1,
                damage: 6
            }
        };
        this._armorTypes = {
            "leather": {
                rarity: 0.5,
                protection: 2
            },
            "chainmail": {
                rarity: 0.2,
                protection: 4
            },
            "iron": {
                rarity: 0.1,
                protection: 6
            }
        };
        this._world = null;

        this._weirdness = -1;

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
        this._inventory.removeClass("hidden");
        this._inventoryButton.removeClass("hidden");
        this._player = new Player(this);
        this._createWorld();
    }
    _createWorld() {
        this._weirdness += 1;
        let numMelatonin = 0;
        let numItems = 0;
        let numEnemies = 0;
        let worldSize = 1 + Math.ceil(Math.pow(Math.E, Math.random()) * this._weirdness);
        if (this._weirdness === 0) {
            this.alertMessage($(`<h3>Use ARROW KEYS to move</h3>`));
            document.addEventListener("keydown", this._playerMove);
            // TODO remove else condition
        } else {
            numMelatonin = this._weirdness + Math.ceil(Math.random(0, 2));
            numItems = this._weirdness + Math.ceil(Math.random(0, 2));
            numEnemies = this._weirdness + Math.ceil(Math.random(0, 2));
        }
        this._world = new World(worldSize, numMelatonin, numItems, numEnemies);
        this._player.melatoninFound = 0;
        this._player.totalMelatonin = numMelatonin;
        this._updateMap(this._world.bedroom);
        this._drawMap();
        this._game.fadeIn("slow");
    }
    _openInventory(event) {
        event.preventDefault();
        this._isInventoryOpen = true;
        this._drawInventory();
        this._inventorySpaces.removeClass("hidden");
        this._inventoryButton.off("click");
        this._inventoryButton.click(this._closeInventory);
    }
    _drawInventory() {
        for (let i = 0; i < 9; i++) {
            let icon = this._player.inventory.html[i];
            let inventorySpace = $(`#space${i}`);
            inventorySpace.html(icon);
            inventorySpace.on("mouseenter", this._displayItem).on("mouseleave", this._removeItem);
        }
    }
    _displayItem(event) {
        let id = event.target.id[5];
        let item = this._player.inventory.contents[id];
        this._selectedItem.html(item.name);
    }
    _removeItem() {
        this._selectedItem.html("");
    }
    _closeInventory(event) {
        event.preventDefault();
        this._isInventoryOpen = false;
        this._inventorySpaces.addClass("hidden");
        this._inventoryButton.off("click");
        this._inventoryButton.click(this._openInventory);
    }
    _playerMove(event) {
        event.preventDefault();
        if (this._keyCodes.hasOwnProperty(event.code)) {
            if (this._alerts.html() !== "") {
                this._alerts.html("");
            }
            let direction = this._keyCodes[event.code];
            this._player.move(direction);
            this._currMap.moveEnemies();
        }
        this._drawMap();
    }
    _getMelatonin(x, y) {
        this.melatoninFound += 1;
        let alertMessage = `<h3>${this.melatoninFound} out of ${this.totalMelatonin} melatonin found</h3>`;
        this._alerts.html($(alertMessage));
        this._currMap.html[x][y] = ".";
    }
    _drawMap() {
        let mapHTML = this._currMap.toHTML();
        let newMapString = "";
        $.each(mapHTML, function (index, string) {
            newMapString += string + "<br/>";
        });
        this._map.html(newMapString);
    }
    sleep() {
        this._alertMessage("sleep");
        document.addEventListener("keydown", this._goToSleep);
    }
    _goToSleep(event) {
        if (event.code === 'Space' || event.key === ' ' || event.keyCode === 32) {
            if (this._weirdness > 0 && this.melatoninFound < this.totalMelatonin) {
                let alertMessage = `<h3>You are not sleepy. Find melatonin to go to sleep</h3>`;
                this._alerts.html($(alertMessage));
                return;
            }
            this._map.fadeOut("slow").promise().done(() => {
                this._player.inventory.clearMelatonin();
                if (this._isInventoryOpen === true) {
                    this._drawInventory();
                }
                this._alerts.html("");
                this._createWorld();
                this._map.fadeIn("slow");
            });
        } else if (event.code === "ArrowLeft" || event.code === "ArrowRight"
            || event.code === "ArrowUp" || event.code === "ArrowDown") {
            this._alerts.html("");
            document.removeEventListener('keydown', this._goToSleep);
        }
    }
    openDoor(x, y) {
        this._door = this._currMap.getTile(x, y);
        this._alertMessage("open door");
        document.addEventListener("keydown", this._tryOpenDoor);
    }
    _tryOpenDoor(event) {
        if (event.code === 'Space' || event.key === ' ' || event.keyCode === 32) {
            if (this._door.dest === null) {
                this._alerts.html("Door is locked");
                return;
            }
            this._replaceTile(this._player);
            let oppositeDoor = this._findOppositeDoor();
            let newMap = oppositeDoor.src;
            let adjacent = newMap.doorFindAdjacent(oppositeDoor);
            this._player.updatePosition(adjacent.x, adjacent.y, newMap);
            this._updateMap(this._door.dest);
            this._drawMap();
        } else if (event.code === "ArrowLeft" || event.code === "ArrowRight"
            || event.code === "ArrowUp" || event.code === "ArrowDown") {
            this._alerts.html("");
            document.removeEventListener('keydown', this._tryOpenDoor);
        }
    }
    _replaceTile(oldTile) {
        let tile = new Tile(oldTile.x, oldTile.y, ".");
        this._currMap.updateTile(tile);
    }
    _updateMap(newMap) {
        this._currMap = newMap;
        this._player.map = newMap;
        this._currMap.updateTile(this._player);
    }
    _findOppositeDoor() {
        for (let key of Object.keys(this._door.dest.tiles)) {
            let door = this._door.dest.tiles[key];
            if (door.dest === this._currMap) {
                return door;
            }
        }
    }
    _generateArmor() {
        // let numOfAttributes =

    }
    _alertMessage(message) {
        let alertMessage = `<h3>Press SPACEBAR to ${message}</h3>`;
        let html = this._alerts.html();
        if (html !== alertMessage) {
            this._alerts.append($(alertMessage));
        }
    }
    alertMessage(message) {
        this._alerts.html(message);
    }
}

class Tile {
    constructor(x, y, icon) {
        this.x = x;
        this.y = y;
        this.icon = icon;

        this.f = 0;
        this.g = 0;
        this.h = 0;
        this.parent = null;
    }
    interact() {
        return;
    }
    // Calculate the heuristic cost (Euclidean distance) from this node to the goal node
    heuristic(goal) {
        return Math.abs(this.x - goal[0]) + Math.abs(this.y - goal[1]);
    }
    // Get neighboring nodes that are walkable
    getNeighbors(tiles) {
        const neighbors = [];
        const dx = [-1, 0, 1, 0]; // Neighboring cell x offsets (left, up, right, down)
        const dy = [0, -1, 0, 1]; // Neighboring cell y offsets (left, up, right, down)
        for (let i = 0; i < 4; i++) {
            const nx = this.x + dx[i];
            const ny = this.y + dy[i];
            let tile = tiles[`${nx},${ny}`];
            if (tile && tile.icon !== ("*") && tile.icon !== (WHITESPACE)) {
                neighbors.push(tile);
            }
        }
        return neighbors;
    }
    updatePosition(newX, newY, map) {
        this.x = newX;
        this.y = newY;
        map.updateTile(this);
    }
}

class Bed extends Tile {
    constructor() {
        super(BED_POSITION.x, BED_POSITION.y, "b");
    }
    interact(player) {
        player.sleep();
    }
}

class Player extends Tile {
    constructor(game) {
        super(PLAYER_START.x, PLAYER_START.y, "X");
        this.game = game;
        this.inventory = new Inventory();
        this.oldPos = [-1, -1];
        this.map = null;

        this.melatoninFound = 0;
        this.totalMelatonin = 0;
    }
    move(direction) {
        let oldPos = [this.x, this.y];
        let newPos = [this.x + direction[0], this.y + direction[1]];
        let tile = this.map.getTile(newPos[0], newPos[1]);
        if (tile.icon === ".") {
            this.updatePosition(this.x + direction[0], this.y + direction[1], this.map);
            this.map.updateTile(this);
            let emptyTile = new Tile(oldPos[0], oldPos[1], ".");
            this.map.tiles[oldPos] = emptyTile;
        } else {
            tile.interact(this);
        }
        return tile;
    }
    pickUpItem(item) {
        if (this.inventory.insert(item) === false) {
            return false;
        }
        return true;
    }
    dropItem(item) {
        this.inventory.remove(item);
    }
    openDoor(x, y) {
        this.game.openDoor(x, y);
    }
    sleep() {
        this.game.sleep();
    }
}

class Inventory {
    constructor() {
        this.html = [".", ".", ".", ".", ".", ".", ".", ".", "."];
        this.contents = [];
    }
    insert(item) {
        if (this.contents.length === 9) {
            return false;
        }
        this.contents.push(item);
        this.html[this.contents.length - 1] = item.icon;
        return true;
    }
    // TODO
    remove(item) {

    }
    clearMelatonin() {
        this.html = this.html.filter(item => item !== "m");
        this.contents = this.contents.filter(item => item.name !== "melatonin");
    }
}

class Item extends Tile {
    constructor(level, materials, type, icon, map) {
        super(null, null, icon);
        this._level = level;
        this._type = type;
        this._attribs = [];
        this._material = this._generateType(materials);
        this.name = `${this._material} ${this._type}`
    }
    _generateType() {
        return;
    }
    interact(player) {
        player.pickUpItem(this);
        this._pickUpAlert(player);
        this.map._replaceTile(this);
    }
    _pickUpAlert(player) {
        player.game.alertMessage(`Found ${this.name}`);
    }
}

class Melatonin extends Item {
    constructor() {
        super();
        this.icon = "m";
        this.name = "melatonin";
    }
    _generateType() {
        return;
    }
    _pickUpAlert(player) {
        player.melatoninFound += 1;
        player.game.alertMessage(`Found ${player.melatoninFound} out of ${player.totalMelatonin} total melatonin`);
    }
}

class Weapon extends Item {
    constructor(level, materials) {
        super(level, materials, "sword", "w");
    }
    _generateType(types) {
        for (let key of Object.keys(types)) {
            let type = types[key];
            let weight = 1 / (this._level - type.rarity) ** 2;
            type.rarity = weight * type.rarity;
        }
        const typeEntries = Object.entries(types);
        const totalRaritySum = typeEntries.reduce((sum, [_, type]) => sum + type.rarity, 0);
        const randomValue = Math.random() * totalRaritySum;
        let cumulativeSum = 0;
        for (const [typeName, type] of typeEntries) {
            cumulativeSum += type.rarity;
            if (randomValue < cumulativeSum) {
                return typeName;
            }
        }
    }
    addAttribute() {

    }
}

class Armor extends Item {
    constructor(level, materials) {
        super(level, materials, "armor", "a");
    }
    _generateType(types) {
        return;
    }
}

class Node {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.g = 0;  // Cost from start node to this node
        this.h = 0;  // Heuristic cost from this node to goal node
        this.f = 0;  // Total cost (f = g + h)
        this.parent = null;
        this.blocked = false; // Whether the node is walkable or not
    }

    // Calculate the heuristic cost (Euclidean distance) from this node to the goal node
    heuristic(goal) {
        return Math.sqrt((this.x - goal.x) ** 2 + (this.y - goal.y) ** 2);
    }

    // Get neighboring nodes that are walkable
    getNeighbors(grid) {
        const neighbors = [];
        const dx = [-1, 0, 1, 0]; // Neighboring cell x offsets (left, up, right, down)
        const dy = [0, -1, 0, 1]; // Neighboring cell y offsets (left, up, right, down)

        for (let i = 0; i < 4; i++) {
            const nx = this.x + dx[i];
            const ny = this.y + dy[i];
            if (nx >= 0 && nx < grid[0].length && ny >= 0 && ny < grid.length && !grid[ny][nx].blocked) {
                neighbors.push(grid[ny][nx]);
            }
        }

        return neighbors;
    }
}

class Enemy extends Tile {
    constructor(level, map) {
        super(null, null, "E");
        this._level = level;
        this._map = map;
        this.x = null;
        this.y = null;
    }
    move(dest) {
        let path = this._aStar(dest);

        this.x = path[0].x;
        this.y = path[0].y;
    }
    _aStar(dest) {
        const openList = [];
        const closedSet = new Set();

        openList.push(this);
        while (openList.length > 0) {
            openList.sort((a, b) => a.f - b.f);
            const current = openList.shift();
            if (current === dest) {
                const path = [];
                let tile = current;
                while (tile) {
                    path.push({ x: tile.x, y: tile.y });
                    tile = tile.parent;
                }
                return path.reverse();
            }
            closedSet.add(current);

            const neighbors = current.getNeighbors(this._map.tiles);
            for (const neighbor of neighbors) {
                if (closedSet.has(neighbor)) continue;

                const tentativeG = current.g + 1; // Assuming each move cost is 1

                if (!openList.includes(neighbor) || tentativeG < neighbor.g) {
                    neighbor.g = tentativeG;
                    neighbor.h = neighbor.heuristic(dest);
                    neighbor.f = neighbor.g + neighbor.h;
                    neighbor.parent = current;

                    if (!openList.includes(neighbor)) {
                        openList.push(neighbor);
                    }
                }
            }
        }
        return null;
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
        this.generate();
    }
    generate() {
        this.tiles = {};
        this._generateCorners();
        this._generateWalls();
        this._generateInterior();
    }
    _generateCorners() {
        this.corners.topLeft = {
            x: getRandomNumber(0, MAP_WIDTH - 10),
            y: getRandomNumber(0, MAP_HEIGHT - 10)
        };
        let height = getRandomNumber(3, 5);
        let width = getRandomNumber(5, 8);
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
        let randomIndex = Math.floor(Math.random() * Object.keys(this.vertices).length);
        let randomKey = Object.keys(this.vertices)[randomIndex];
        return this.vertices[randomKey];
    }
    getConnectedComponents() {
        let visited = {};
        let connectedComponents = [];
        for (let vertex of Object.keys(this.vertices)) {
            if (!visited[vertex]) {
                let component = [];
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
    constructor(size, numMelatonin, numItems, numEnemies) {
        super();
        this.size = size;
        this.bedroom = null;
        this._numMelatonin = numMelatonin;
        this._numItems = numItems;
        this._numEnemies = numEnemies;
        this.generate();
    }
    generate() {
        this.removeAllVertices();
        this.melatoninFound = 0;
        for (let i = 1; i < this.size; i++) {
            let map = new Map(i);
            map.generate();
            this.addVertex(map);
        }
        this.randomlyAddEdges();
        let bedroom = new Bedroom(this.size);
        bedroom.generate();
        this.bedroom = bedroom;
        this.addVertex(bedroom);
        let randomVertex = this.getRandomVertex();
        if (this.size > 1) {
            while (randomVertex === bedroom) {
                randomVertex = this.getRandomVertex();
            }
            this.addEdge(bedroom, randomVertex);
        }
        this._populate();
    }
    _populate() {
        this._addDoors();
        this._addMelatonin();
        // this._addItems();
        // this._addEnemies();
    }
    _addDoors() {
        if (this.size === 1) {
            let door = new Door(this.bedroom, null);
            return;
        }
        for (let key of Object.keys(this.vertices)) {
            let map = this.vertices[key];
            let adjacents = this.adjacencyList[map.id];
            for (let adjacent of adjacents) {
                let adjacentMap = this.vertices[adjacent];
                let door = new Door(map, adjacentMap);
            }
        }
    }
    _addMelatonin() {
        let melatoninAdded = 0;
        while (melatoninAdded < this._numMelatonin) {
            let randomMap = this.getRandomVertex();
            let melatonin = new Melatonin();
            if (randomMap.addItem(melatonin) === true) {
                melatoninAdded += 1;
            }
        }
    }
    _addItems() {
        let itemsAdded = 0;
        while (itemsAdded < this._numItems) {
            let randomMap = this.getRandomVertex();
            if (getRandomNumber(0, 1) === 0) {
                let weapon = new Weapon(this._weirdness, this._weaponTypes);
                if (randomMap.addItem(weapon) === true) {
                    itemsAdded += 1
                }
            } else {
                let armor = new Armor(this._weirdness, this._armorTypes);
                if (randomMap.addItem(armor) === true) {
                    itemsAdded += 1
                }
            }
        }
    }

    _addEnemies() {
        let enemiesAdded = 0;
        while (enemiesAdded < this._numEnemies) {
            let randomMap = this.getRandomVertex();
            let enemy = new Enemy(this._weirdness, randomMap);
            if (randomMap.addItem(enemy) === true) {
                enemiesAdded += 1;
            }
        }
    }
}

class Map extends Graph {
    constructor(id) {
        super();
        this.id = id;
        this._height = MAP_HEIGHT;
        this._width = MAP_WIDTH;
        this.html = [];
        this.tiles = {};
        this.enemies = {};
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
        if (this.getTile(door.x, door.y).icon === "." || this.getTile(door.x, door.y).icon === "d") {
            this.drawDoor(door);
        }
        this.tiles[[door.x, door.y]] = door;
    }
    updateTile(newTile) {
        this.tiles[[newTile.x, newTile.y]] = newTile;
    }
    generate() {
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
            this.tiles = Object.assign({}, this.tiles, room.tiles);
            for (let coords of Object.keys(room.tiles)) {
                let tile = room.tiles[coords];
                this.html[tile.y][tile.x] = tile.icon;
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
                room.generate();
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
            let tile = new Tile(px[0], px[1], ".");
            this.tiles[[px[0], px[1]]] = tile;
            this.html[px[1]][px[0]] = ".";
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
        item.x = x;
        item.y = y;
        this.updateTile(item);
        return true;
    }
    moveEnemies(playerPosition) {
        let enemies = Object.keys(this.tiles).filter(key => this.tiles[key].icon === "E");
        for (let key of enemies) {
            let enemy = this.tiles[key];
            this.tiles[[enemy.x, enemy.y]] = new Tile(enemy.x, enemy.y, ".");
            this.html[enemy.x][enemy.y] = ".";
            enemy.move(playerPosition);
            this.tiles[[enemy.x, enemy.y]] = enemy;
            this.html[enemy.x][enemy.y] = enemy.icon;
        }
    }
    getTile(x, y) {
        let tile = this.tiles[`${x},${y}`];
        if (tile) return tile;
        else return null;
    }
    toHTML() {
        let newMap = [];
        for (let i = 0; i < this._height; i++) {
            newMap[i] = "";
            for (let j = 0; j < this._width; j++) {
                let tile = this.getTile(j, i);
                if (tile === null) {
                    newMap[i] += WHITESPACE;
                } else {
                    newMap[i] += tile.icon;
                }
            }
        }
        // for (let key of Object.keys(this.tiles)) {
        //     let tile = this.tiles[key];
        //     let coords = key.split(",");
        //     let x = parseInt(coords[0]);
        //     let y = parseInt(coords[1]);
        //     newMap[y][x] = tile.icon;
        // }
        return newMap;
    }
    doorFindAdjacent(door) {
        let adjacents = [
            [1, 0],
            [-1, 0],
            [0, 1],
            [0, -1]
        ];
        for (let adjacent of adjacents) {
            let tile = this.getTile(door.x + adjacent[0], door.y + adjacent[1]);
            if (tile && tile.icon === ".") {
                return tile;
            }
        }
    }
}

class Bedroom extends Map {
    constructor(id) {
        super(id);
        this._height = BEDROOM_HEIGHT;
        this._width = BEDROOM_WIDTH;
        this._isBedroom = true;
        this.map = [
            ["*", "*", "*", "*", "*", "*", "*", "*", "*", "*", "*"],
            ["*", ".", ".", ".", ".", ".", ".", ".", ".", ".", "*"],
            ["*", ".", ".", ".", ".", ".", ".", ".", ".", ".", "*"],
            ["*", ".", ".", ".", ".", ".", ".", ".", ".", ".", "*"],
            ["*", "*", "*", "*", "*", "*", "*", "*", "*", "*", "*"],
        ];
        this.generate();
    }
    drawDoor(door) {
        door.x = BEDROOM_DOOR.x;
        door.y = BEDROOM_DOOR.y;
        this.updateTile(door);
    }
    generate() {
        for (let i = 0; i < this.map.length; i++) {
            for (let j = 0; j < this.map[0].length; j++) {
                this.tiles[[j, i]] = new Tile(j, i, this.map[i][j]);
            }
        }
        let bed = new Bed();
        this.updateTile(bed);
    }
    addItem() {
        return false;
    }
}

class Door extends Tile {
    constructor(src, dest) {
        super();
        this.icon = "d";
        this.src = src;
        this.dest = dest;
        this.adjacent = null;
        this.src.drawDoor(this);
    }
    interact(player) {
        player.openDoor(this.x, this.y);
    }
}

let game = new Game();