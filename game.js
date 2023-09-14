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

const PLAYER_HP_START = 50000;
const PLAYER_ATK_START = 1;
const PLAYER_DEF_START = 1;

const ENEMY_HP_START = 5;
const ENEMY_ATK_START = 1;
const ENEMY_DEF_START = 1;

const HEALTH_POTION_START = 10;

const RARITY_BOUND = 0.1;

const DEF_CONST = 0.25;

const WEAPON_TYPES = {
    "wood": {
        name: "wood",
        rarity: 0,
        damage: 1
    },
    "stone": {
        name: "stone",
        rarity: 3,
        damage: 3
    },
    "iron": {
        name: "iron",
        rarity: 6,
        damage: 6
    },
    "steel": {
        name: "steel",
        rarity: 9,
        damage: 10
    },
    "diamond": {
        name: "diamond",
        rarity: 12,
        damage: 15
    }
}

const ARMOR_TYPES = {
    "leather": {
        name: "leather",
        rarity: 0,
        protection: 1
    },
    "chainmail": {
        name: "chainmail",
        rarity: 3,
        protection: 3
    },
    "iron": {
        name: "iron",
        rarity: 6,
        protection: 6
    },
    "steel": {
        name: "steel",
        rarity: 9,
        protection: 10
    },
    "diamond": {
        name: "diamond",
        rarity: 12,
        protection: 15
    }
}

const WHITESPACE = "&nbsp;";
// const WHITESPACE = "-";

function getRandomNumber(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function logTransformation(x) {
    return Math.ceil(Math.log(x) + 1);
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
        this._melatonin = $("#melatonin");
        this._selectedItem = $("#selectedItem");
        this._playerHP = $("#hp");
        this._playerEXP = $("#exp");
        this._equippedWeapon = $("#weapon");
        this._equippedArmor = $("#armor");

        this._onStart = this._onStart.bind(this);
        this._loadGame = this._loadGame.bind(this);
        this._playerMove = this._playerMove.bind(this);
        this._goToSleep = this._goToSleep.bind(this);
        this._tryOpenDoor = this._tryOpenDoor.bind(this);
        this._openInventory = this._openInventory.bind(this);
        this._closeInventory = this._closeInventory.bind(this);
        this._displayItem = this._displayItem.bind(this);
        this._removeItem = this._removeItem.bind(this);
        this._equipItem = this._equipItem.bind(this);
        this._dropItem = this._dropItem.bind(this);
        this._attack = this._attack.bind(this);

        this.isInventoryOpen = false;

        this._inventoryButton.click(this._openInventory);
        this._playButton.click(this._onStart);

        for (let space of this._inventorySpaces.children()) {
            space.addEventListener("click", this._equipItem);
            space.addEventListener("contextmenu", this._dropItem);
        }

        this._keyCodes = {
            "ArrowLeft": [-1, 0],
            "ArrowUp": [0, -1],
            "ArrowRight": [1, 0],
            "ArrowDown": [0, 1]
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
        this._inventory.removeClass("hiddenInventory");
        this._inventoryButton.removeClass("hidden");
        this._player = new Player(this);
        this._playerHP.html(`HP: ${this._player.hp}`);
        this._playerEXP.html(`EXP: ${this._player.exp}`);
        this._equippedWeapon.html(`Weapon: none`);
        this._equippedArmor.html(`Armor: none`)
        this._createWorld();
    }
    _createWorld() {
        this._weirdness += 1;
        let numMelatonin;
        let numItems;
        let numEnemies;
        let worldSize = 1 + Math.ceil(0.5 * Math.pow(Math.E, Math.random()) * this._weirdness);
        if (this._weirdness === 0) {
            this.alertMessage($(`<h3>Use ARROW KEYS to move</h3>`));
            document.addEventListener("keydown", this._playerMove);
            // TODO remove else condition
        } else {
            numMelatonin = logTransformation(this._weirdness);
            numItems = logTransformation(this._weirdness);
            numEnemies = logTransformation(this._weirdness);
        }
        this._world = new World(worldSize, numMelatonin, numItems, numEnemies, this._weirdness);
        this._player.melatoninFound = 0;
        this._player.totalMelatonin = numMelatonin;
        this._updateMap(this._world.bedroom);
        this._drawMap();
        this._game.fadeIn("slow");
    }
    _openInventory(event) {
        event.preventDefault();
        this.isInventoryOpen = true;
        this.drawInventory();
        this._inventorySpaces.removeClass("hiddenInventory");
        this._melatonin.removeClass("hiddenInventory");
        this._inventoryButton.off("click");
        this._inventoryButton.click(this._closeInventory);
    }
    drawInventory() {
        for (let i = 0; i < 9; i++) {
            let key = Object.keys(this._player.inventory.contents)[i];
            let icon = ".";
            if (this._player.inventory.contents[key]) {
                icon = this._player.inventory.contents[key].icon;
            }
            let inventorySpace = $(`#space${i}`);
            inventorySpace.html(icon);
            inventorySpace.on("mouseenter", this._displayItem).on("mouseleave", this._removeItem);
        }
    }
    _displayItem(event) {
        let slot = event.target;
        let id = slot.id[5];
        let item = this._player.inventory.contents[id];
        if (item) {
            if (item.icon === "m") {
                this._selectedItem.html("melatonin");
            } else if (item.icon === "p") {
                this._selectedItem.html(`${item.name} LCLICK to drink RCLICK to drop`);
            } else {
                if (slot.classList.contains("selected")) {
                    this._selectedItem.html(`${item.name} Equipped`);
                } else {
                    this._selectedItem.html(`${item.name} LCLICK to equip RCLICK to drop`);
                }
            }
        }
    }
    _removeItem() {
        this._selectedItem.html("");
    }
    _closeInventory(event) {
        event.preventDefault();
        this.isInventoryOpen = false;
        this._inventorySpaces.addClass("hiddenInventory");
        this._melatonin.addClass("hiddenInventory");
        this._inventoryButton.off("click");
        this._inventoryButton.click(this._openInventory);
    }
    updateMelatonin() {
        this._melatonin.html(`Melatonin found: ${this._player.melatoninFound}/${this._player.totalMelatonin}`);
    }
    _playerMove(event) {
        event.preventDefault();
        if (this._keyCodes.hasOwnProperty(event.code)) {
            if (this._alerts.html() !== "") {
                this._alerts.html("");
            }
            let direction = this._keyCodes[event.code];
            this._player.move(direction);
            this._currMap.moveEnemies(this._player);
            let neighbors = this._player.getNeighbors(this._currMap.tiles)
            for (let neighbor of neighbors) {
                if (neighbor.icon === "E") {
                    if (!this._attackingEnemy) {
                        this.alertMessage("Press SPACEBAR to attack");
                    }
                    this._attackingEnemy = neighbor;
                    document.addEventListener("keydown", this._attack);
                }
            }
            if (this._player.buffTurnsRemaining > 0) {
                this._player.decrementBuff();
                if (this._player.buffTurnsRemaining === 0) {
                    this.alertMessage("Strength ran out");
                    this._player.runOutOfStrength();
                }
            }
        }
        this._drawMap();
    }
    _attack(event) {
        this._alerts.html("");
        let playerDamage = this._player.takeDamage(this._attackingEnemy);
        let string = `Player took ${playerDamage} damage; remaining ${this._player.hp}`
        this._playerHP.html(`HP: ${this._player.hp}`);
        if (this._player.hp <= 0) {
            // TODO death animation
            alert("YOU DIED LOL");
        }
        if (event.code === 'Space') {
            let enemyDamage = this._attackingEnemy.takeDamage(this._player);
            string = string.concat(`<br>Enemy took ${enemyDamage} damage; remaining ${this._attackingEnemy.hp}`);
            if (this._attackingEnemy.hp <= 0) {
                this.alertMessage("Enemy died<br>Gained 1 EXP");
                this._player.exp += 1;
                this._playerEXP.html(`EXP: ${this._player.exp}`);
                this._currMap.replaceTile(this._attackingEnemy);
                document.removeEventListener("keydown", this._attack);
                this._attackingEnemy = null;
                return;
            }
        }
        this.alertMessage(string);
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
            if (this._weirdness > 0 && this._player.melatoninFound < this._player.totalMelatonin) {
                let alertMessage = `<h3>You are not sleepy. Find melatonin to go to sleep</h3>`;
                this._alerts.html($(alertMessage));
                return;
            }
            this._map.fadeOut("slow").promise().done(() => {
                this._player.inventory.clearMelatonin();
                if (this.isInventoryOpen === true) {
                    this.drawInventory();
                }
                this._alerts.html("");
                this._createWorld();
                this._melatonin.html(`Melatonin found: ${this._player.melatoninFound}/${this._player.totalMelatonin}`)
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
            if (this._attackingEnemy) {
                this._attackingEnemy = null;
                document.removeEventListener("keydown", this._attack);
            }
            this._currMap.replaceTile(this._player);
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
    _equipItem(event) {
        let inventorySpace = event.target;
        let id = event.target.id[5];
        let item = this._player.inventory.contents[id];
        if (item) {
            if (item.icon === "m") {
                return;
            } else if (item.icon === "p") {
                this._drinkPotion(id, item);
            } else {
                if (item.icon === "w") {
                    this._equipWeapon(id, item);

                } else if (item.icon === "a") {
                    this._equipArmor(id, item);
                }
                item.isEquipped = true;
                this.alertMessage(`Equipped ${item.name}`);
                inventorySpace.classList.add("selected");
            }
        }
    }
    _equipWeapon(id, weapon) {
        this._player.equipWeapon(id, weapon);
        if (this._player.equippedWeapon) {
            let oldKey = this._player.equippedWeapon.key;
            let oldSpace = $(`#space${oldKey}`);
            oldSpace.removeClass("selected");
        }
        this._player.equippedWeapon = {
            key: id,
            val: weapon,
        };
        this._selectedItem.html(`${weapon.name} Equipped`);
        this._equippedWeapon.html(`Weapon: ${weapon.name}`);
    }
    _equipArmor(id, armor) {
        this._player.equipArmor(id, armor);
        if (this._player.equippedArmor) {
            let oldKey = this._player.equippedArmor.key;
            let oldSpace = $(`#space${oldKey}`);
            oldSpace.removeClass("selected");
        }
        this._player.equippedArmor = {
            key: id,
            val: armor,
        };
        this._selectedItem.html(`${armor.name} Equipped`);
        this._equippedArmor.html(`Armor: ${armor.name}`);
    }
    _dropItem(event) {
        event.preventDefault();
        let id = event.target.id[5];
        let item = this._player.inventory.contents[id];
        if (item) {
            if (this._player.equippedArmor && this._player.equippedArmor.val === item) return;
            if (this._player.equippedWeapon && this._player.equippedWeapon.val === item) return;
            let neighbors = this._player.getOpenNeighbors(this._currMap.tiles);
            for (let neighbor of neighbors) {
                if (this._currMap.isOpenTile(neighbor.x, neighbor.y)) {
                    item.x = neighbor.x;
                    item.y = neighbor.y;
                    this._currMap.updateTile(item);
                    this._drawMap();
                    this._player.inventory.remove(id);
                    this.drawInventory();
                    break;
                }
            }
            this._selectedItem.html("");
        }
    }
    _drinkPotion(id, potion) {
        this._player.inventory.remove(id);
        this.drawInventory();
        this._player.drinkPotion(potion);
        this._playerHP.html(`HP: ${this._player.hp}`);
        this.alertMessage(potion.message);
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
        let neighbors = [];
        let dx = [-1, 0, 1, 0]; // Neighboring cell x offsets (left, up, right, down)
        let dy = [0, -1, 0, 1]; // Neighboring cell y offsets (left, up, right, down)
        for (let i = 0; i < 4; i++) {
            let nx = this.x + dx[i];
            let ny = this.y + dy[i];
            if (Object.keys(tiles).indexOf(`${nx},${ny}`) !== -1) {
                let tile = tiles[`${nx},${ny}`]
                neighbors.push(tile);
            }
        }
        return neighbors;
    }
    getOpenNeighbors(tiles) {
        let neighbors = this.getNeighbors(tiles);
        return neighbors.filter((neighbor) => neighbor.icon === ".");
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

class Entity extends Tile {
    constructor(x, y, icon, hp, atk) {
        super(x, y, icon);
        this.hp = hp;
        this.atk = atk;
    }
}

class Player extends Entity {
    constructor(game) {
        super(PLAYER_START.x, PLAYER_START.y, "X", PLAYER_HP_START, PLAYER_ATK_START, PLAYER_DEF_START);
        this.game = game;
        this.inventory = new Inventory();
        this.oldPos = [-1, -1];
        this.map = null;

        this.equippedWeapon = null;
        this.equippedArmor = null;
        this.hp = PLAYER_HP_START;
        this.baseAtk = PLAYER_ATK_START;
        this.baseDef = PLAYER_DEF_START;
        this.exp = 0;
        this.def = 1;

        this.melatoninFound = 0;
        this.totalMelatonin = 0;
    }
    takeDamage(opp) {
        let damageToTake = Math.floor(opp.atk * (1 / this.def));
        this.hp -= damageToTake;
        return damageToTake;
    }
    move(direction) {
        let oldPos = [this.x, this.y];
        let newPos = [this.x + direction[0], this.y + direction[1]];
        let tile = this.map.getTile(newPos[0], newPos[1]);
        if (tile.icon === ".") {
            this.map.replaceTile(this);
            this.updatePosition(this.x + direction[0], this.y + direction[1], this.map);
            this.map.updateTile(this);
        } else {
            tile.interact(this);
        }
        return tile;
    }
    pickUpItem(item) {
        if (this.inventory.insert(item) === false) {
            return false;
        }
        if (this.game.isInventoryOpen) {
            this.game.drawInventory();
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
    equipWeapon(id, weapon) {
        this.weapon = {
            key: id,
            val: weapon
        };
        this.atk = this.baseAtk + this.weapon.val.material.damage;
    }
    equipArmor(id, armor) {
        this.armor = {
            key: id,
            val: armor
        };
        this.def = this.baseDef + this.armor.val.material.protection;
    }
    drinkPotion(potion) {
        potion.giveEffects(this);
    }
    addStrength(strengthToAdd) {
        this.buffTurnsRemaining = 20;
        this.buffedStrength = strengthToAdd;
        this.atk += this.buffedStrength;
    }
    decrementBuff() {
        this.buffTurnsRemaining -= 1;
    }
    runOutOfStrength() {
        this.atk -= this.buffedStrength;
        this.buffedStrength = 0;
    }
    addHealth(healthToAdd) {
        if (this.hp + healthToAdd > PLAYER_HP_START) {
            this.hp = PLAYER_HP_START;
        } else {
            this.hp += healthToAdd;
        }
    }
}

class Inventory {
    constructor() {
        this.contents = {
            0: null,
            1: null,
            2: null,
            3: null,
            4: null,
            5: null,
            6: null,
            7: null,
            8: null,
            9: null
        };
    }
    insert(item) {
        for (let key of Object.keys(this.contents)) {
            if (!this.contents[key]) {
                this.contents[key] = item;
                return true;
            }
        }
        return false;
    }
    // TODO
    remove(id) {
        this.contents[id] = null;
    }
    clearMelatonin() {
        for (let key of Object.keys(this.contents)) {
            if (this.contents[key] && this.contents[key].icon === "m") {
                this.contents[key] = null;
            }
        }
    }
}

class Item extends Tile {
    constructor(map) {
        super(null, null, null);
        this._map = map;
        this._attribs = [];
    }
    _pickUpAlert(player) {
        player.game.alertMessage(`Found ${this.name}`);
    }
    interact(player) {
        if (player.pickUpItem(this)) {
            this._pickUpAlert(player);
            player.map.replaceTile(this);
        } else {
            player.game.alertMessage("Inventory full");
        }
    }
}

class Melatonin extends Item {
    constructor(map) {
        super(map);
        this.icon = "m";
        this.name = "melatonin";
    }
    interact(player) {
        this._map.replaceTile(this);
        player.melatoninFound += 1;
        player.game.updateMelatonin();
        player.game.alertMessage(`Found ${player.melatoninFound} out of ${player.totalMelatonin} total melatonin`);
    }
}

class Weapon extends Item {
    constructor(map, material) {
        super(map);
        this.icon = "w";
        this.material = material;
        this.name = `${this.material.name} sword`;
    }
    addAttribute() {
        //TODO
    }
}

class Armor extends Item {
    constructor(map, material) {
        super(map);
        this.icon = "a";
        this.material = material;
        this.name = `${this.material.name} armor`;
    }
}

class Potion extends Item {
    constructor(level, type, map) {
        super(map);
        this._level = level;
        this.icon = "p";
        this.type = type;
        this.name = `${this.type} potion`;
    }
}

class StrengthPotion extends Potion {
    constructor(level, map) {
        super(level, "strength", map);
    }
    giveEffects(player) {
        let strengthAdded = 1 + Math.floor(Math.log(this._level));
        this.message = `Gained ${strengthAdded} strength for 20 turns`;
        player.addStrength(strengthAdded);
    }
}

class HealthPotion extends Potion {
    constructor(level, map) {
        super(level, "health", map);
    }
    giveEffects(player) {
        let healthAdded = HEALTH_POTION_START + Math.floor(Math.log(this._level));
        this.message = `Gained ${healthAdded} health`;
        player.addHealth(healthAdded);
    }
}

class Enemy extends Entity {
    constructor(level, map, hp, atk, def) {
        super(null, null, "E");
        this._level = level;
        this._map = map;
        this.hp = hp;
        this.atk = atk;
        this.def = def;
    }
    takeDamage(opp) {
        this.hp -= opp.atk;
        return opp.atk;
    }
    move(dest) {
        let path = this._aStar(dest);
        if (path && path.length > 1) {
            this.x = path[1].x;
            this.y = path[1].y;
        }
    }
    _aStar(dest) {
        let openSet = [this];
        let closedSet = new Set();

        while (openSet.length > 0) {
            let currentNode = openSet[0];
            let currentIndex = 0;

            for (let i = 1; i < openSet.length; i++) {
                if (openSet[i].f < currentNode.f) {
                    currentNode = openSet[i];
                    currentIndex = i;
                }
            }

            openSet.splice(currentIndex, 1);
            closedSet.add(currentNode);

            let neighbors = [];
            for (let neighbor of currentNode.getNeighbors(this._map.tiles)) {
                if (neighbor === dest) {
                    let path = [];
                    let current = currentNode;
                    while (current !== null) {
                        path.push({ x: current.x, y: current.y });
                        current = current.parent;
                    }
                    return path.reverse();
                }
            }

            for (let neighbor of currentNode.getOpenNeighbors(this._map.tiles)) {
                if (neighbor && neighbor.icon === ".") {
                    neighbors.push(neighbor);
                }
            }
            for (let neighbor of neighbors) {
                if (!closedSet.has(neighbor)) {
                    let tentativeG = currentNode.g + 1;
                    if (tentativeG < neighbor.g || !openSet.includes(neighbor)) {
                        neighbor.g = tentativeG;
                        neighbor.h = neighbor.heuristic(dest);
                        neighbor.f = neighbor.g + neighbor.h;
                        neighbor.parent = currentNode;

                        if (!openSet.includes(neighbor)) {
                            openSet.push(neighbor);
                        }
                    }
                }
            }
        }
        return null; // No path found
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
            let neighbors = this.adjacencyList[vertex].join(", ");
            console.log(`${vertex} -> ${neighbors}`);
        }
    }
    removeAllVertices() {
        this.vertices = {};
        this.adjacencyList = {};
    }
    randomlyAddEdges() {
        let numEdges = Math.floor(Math.random() * (Object.keys(this.vertices).length - 1));
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
}

class World extends Graph {
    constructor(size, numMelatonin, numItems, numEnemies, weirdness) {
        super();
        this.size = size;
        this.bedroom = null;
        this.numMelatonin = numMelatonin;
        this._numItems = numItems;
        this._numEnemies = numEnemies;
        this._weirdness = weirdness;
        this.melatonin = [];
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
        this._addItems();
        this._addEnemies();
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
        while (melatoninAdded < this.numMelatonin) {
            let randomMap = this.getRandomVertex();
            let melatonin = new Melatonin(randomMap);
            if (randomMap.addItem(melatonin) === true) {
                melatoninAdded += 1;
                this.melatonin.push(randomMap);
            }
        }
    }
    _addItems() {
        let itemsAdded = 0;
        while (itemsAdded < this._numItems) {
            let randomMap = this.getRandomVertex();
            let material;
            if (Math.random() < 0.333) {
                material = this._generateMaterial(WEAPON_TYPES);
                let weapon = new Weapon(randomMap, material);
                if (randomMap.addItem(weapon) === true) {
                    itemsAdded += 1
                }
            // } else if (Math.random() > 0.666) {
            //     material = this._generateMaterial(ARMOR_TYPES);
            //     let armor = new Armor(randomMap, material);
            //     if (randomMap.addItem(armor) === true) {
            //         itemsAdded += 1
            //     }
            } else {
                let potion;
                if (getRandomNumber(0, 1) === 0) {
                    potion = new StrengthPotion(this._weirdness, randomMap);
                } else {
                    potion = new HealthPotion(this._weirdness, randomMap);
                }
                if (randomMap.addItem(potion) === true) {
                    itemsAdded += 1
                }
            }
        }
    }
    _generateMaterial(materials) {
        let chances = {};
        for (let key of Object.keys(materials)) {
            let material = materials[key];
            let chance = this._generateChance(material);
            chances[chance] = material;
        }
        let entries = Object.keys(chances).map(str => parseFloat(str));
        let totalRaritySum = entries.reduce((a, b) => {
            return a + b;
        });
        let randomValue = Math.random() * totalRaritySum;
        let cumulativeSum = 0;
        for (let chance of entries) {
            cumulativeSum += chance
            if (randomValue < cumulativeSum) {
                return chances[chance];
            }
        }
    }
    _generateChance(material) {
        return Math.E ** (-((this._weirdness - material.rarity) ** 2));
    }
    _addEnemies() {
        let enemiesAdded = 0;
        while (enemiesAdded < this._numEnemies) {
            let randomMap = this.getRandomVertex();
            let hp = Math.floor(0.5 * this._weirdness + ENEMY_HP_START);
            let atk = Math.floor(0.5 * this._weirdness + ENEMY_ATK_START);
            let enemy = new Enemy(this._weirdness, randomMap, hp, atk);
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
    replaceTile(oldTile) {
        let tile = new Tile(oldTile.x, oldTile.y, ".");
        this.updateTile(tile);
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
        this.tiles[`${newTile.x},${newTile.y}`] = newTile;
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
        item.x = getRandomNumber(randomRoom.xMin + 1, randomRoom.xMax - 1);
        item.y = getRandomNumber(randomRoom.yMin + 1, randomRoom.yMax - 1);
        while (!this._isValidItemLocation(item)) {
            item.x = getRandomNumber(randomRoom.xMin + 1, randomRoom.xMax - 1);
            item.y = getRandomNumber(randomRoom.yMin + 1, randomRoom.yMax - 1);
        }
        this.updateTile(item);
        return true;
    }
    _isValidItemLocation(item) {
        if (!this.isOpenTile(item.x, item.y)) {
            return false;
        }
        for (let tile of item.getNeighbors(this.tiles)) {
            if (tile.icon === 'd') {
                return false;
            }
        }
        return true;
    }
    _adjacentsAreClear(x, y) {
        let dirs = [[-1, 0], [1, 0], [0, 1], [0, -1]];
        for (let dir of dirs) {
            let adjX = x + dir[0];
            let adjY = y + dir[1];
            if (this.getTile(adjX, adjY).icon === ".") {
                return true;
            }
        }
        return false;
    }
    moveEnemies(player) {
        let enemies = Object.keys(this.tiles).filter(key => this.tiles[key].icon === "E");
        for (let key of enemies) {
            let enemy = this.tiles[key];
            this.replaceTile(enemy);
            enemy.move(player);
            this.updateTile(enemy);
        }
    }
    getTile(x, y) {
        let tile = this.tiles[`${x},${y}`];
        if (tile) return tile;
        else return null;
    }
    isOpenTile(x, y) {
        return (this.getTile(x, y).icon === ".");
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