const { Client, Intents, MessageEmbed } = require("discord.js");
const fs = require("fs");
const path = require("path");

// Configuração
const config = { prefix: ".", developerID: "519666024220721152" };

// Simple database replacement
const dbPath = path.join(__dirname, "database.json");
const db = {
  get: (key) => {
    try {
      const data = JSON.parse(fs.readFileSync(dbPath, "utf8"));
      return data[key] || null;
    } catch {
      return null;
    }
  },
  set: (key, value) => {
    try {
      let data = {};
      try {
        data = JSON.parse(fs.readFileSync(dbPath, "utf8"));
      } catch {}
      data[key] = value;
      fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
      return value;
    } catch {
      return null;
    }
  },
  delete: (key) => {
    try {
      let data = {};
      try {
        data = JSON.parse(fs.readFileSync(dbPath, "utf8"));
      } catch {}
      delete data[key];
      fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
      return true;
    } catch {
      return false;
    }
  },
};

// Create client with basic intents
const client = new Client({
  intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES],
});

console.log("Starting bot...");

// Commands
const commands = new Map();

// Help command
commands.set("help", {
  run: (client, message, args) => {
    const embed = new MessageEmbed()
      .setTitle("Help")
      .setDescription(
        `**Aqui estão os comandos:**
> \`${config.prefix}setverify\`: Setar o canal de verificação
> \`${config.prefix}setrole\`: Setar o cargo que será dado quando verificar
> \`${config.prefix}setrrole\`: Setar o cargo de random
> \`${config.prefix}verify\`: Verificar
> \`${config.prefix}rvrole\`: Resetar o cargo de verificação
> \`${config.prefix}rvchannel\`: Resetar o canal de verificação
> \`${config.prefix}rrvrole\`: Resetar o cargo de random`,
      )
      .setColor("#000000")
      .setTimestamp();
    message.channel.send({ embeds: [embed] });
  },
});

// Set verify channel
commands.set("setverify", {
  run: (client, message, args) => {
    if (!message.member.permissions.has("ADMINISTRATOR")) {
      return message.channel.send(
        "Você não tem permissão pra usar esse comando, macaco.",
      );
    }
    const channel = message.mentions.channels.first();
    if (!channel) {
      return message.channel.send(
        "Tu precisa me falar o canal de verificação.",
      );
    }
    db.set(`verify_${message.guild.id}`, channel.id);
    message.channel.send(
      `Agora ${channel} foi setado como canal de verificação`,
    );
  },
});

// Set verification role
commands.set("setrole", {
  run: (client, message, args) => {
    if (!message.member.permissions.has("ADMINISTRATOR")) {
      return message.channel.send(
        "Você não tem permissão pra usar esse comando, macaco.",
      );
    }
    const role = message.mentions.roles.first();
    if (!role) {
      return message.channel.send(
        "Qual é o cargo que tu quer que eu dê quando eles verificarem, porra?",
      );
    }
    db.set(`verole_${message.guild.id}`, role.id);
    message.channel.send(`Agora \`${role}\` será dado quando eles verificarem`);
  },
});

// Set removal role
commands.set("setrrole", {
  run: (client, message, args) => {
    if (!message.member.permissions.has("ADMINISTRATOR")) {
      return message.channel.send(
        "Você não tem permissão pra usar esse comando, macaco.",
      );
    }
    const role = message.mentions.roles.first();
    if (!role) {
      return message.channel.send(
        "Qual é o cargo que tu quer que eu tire quando eles verificarem?",
      );
    }
    db.set(`srrole_${message.guild.id}`, role.id);
    message.channel.send(
      `Agora \`${role}\` será tirado quando eles verificarem`,
    );
  },
});

// Verify command
commands.set("verify", {
  run: async (client, message, args) => {
    const rRole = db.get(`verole_${message.guild.id}`);
    const rerole = db.get(`srrole_${message.guild.id}`);
    const chx = db.get(`verify_${message.guild.id}`);

    if (!chx) {
      return message.channel.send(
        "Canal fantasma caralho? Use `.setverify #channel` para setar o canal de verificação.",
      );
    }

    if (message.channel.id !== chx) {
      return; // Only work in verification channel
    }

    if (!rRole) {
      return message.channel.send(
        "O cargo de verificação não foi setado, use `.setrole @role` para setar o cargo de verificação, imbecil",
      );
    }
    z;

    const myRole = message.guild.roles.cache.get(rRole);
    if (!myRole) {
      return message.channel.send(
        "O cargo de verificação não existe mais, chama os cara ai pra setar denovo ",
      );
    }

    try {
      await message.member.roles.add(myRole);

      if (rerole) {
        const reerole = message.guild.roles.cache.get(rerole);
        if (reerole) {
          await message.member.roles.remove(reerole);
        }
      }

      message.author
        .send(`Tu foi verificado(a) em ${message.guild.name}`)
        .catch(() => {
          message.channel.send(
            `${message.member}, Tu foi verificado em ${message.guild.name}, porém não consegui te mandar uma mensagem no privado. Verifica se tu tem o privado aberto.`,
          );
        });
    } catch (error) {
      message.channel.send(
        "Não foi possível verificar você. Por favor, contate um administrador.",
      );
    }
  },
});

// Add aliases
commands.set("accept", commands.get("verify"));
commands.set("sv", commands.get("setverify"));
commands.set("sr", commands.get("setrole"));
commands.set("srr", commands.get("setrrole"));

// Reset commands
commands.set("rvchannel", {
  run: (client, message, args) => {
    if (!message.member.permissions.has("ADMINISTRATOR")) {
      return message.channel.send(
        "Você não tem permissão pra usar esse comando, macaco.",
      );
    }
    db.delete(`verify_${message.guild.id}`);
    message.channel.send("O canal de verificação foi resetado");
  },
});

commands.set("rvrole", {
  run: (client, message, args) => {
    if (!message.member.permissions.has("ADMINISTRATOR")) {
      return message.channel.send(
        "Você não tem permissão pra usar esse comando, macaco.",
      );
    }
    db.delete(`verole_${message.guild.id}`);
    message.channel.send("O cargo de verificação foi resetado");
  },
});

commands.set("rrvrole", {
  run: (client, message, args) => {
    if (!message.member.permissions.has("ADMINISTRATOR")) {
      return message.channel.send(
        "Você não tem permissão pra usar esse comando, macaco.",
      );
    }
    db.delete(`srrole_${message.guild.id}`);
    message.channel.send("O cargo de random foi resetado");
  },
});

// Message handler
client.on("messageCreate", async (message) => {
  if (message.author.bot) return;
  if (!message.guild) return;

  // Auto-delete in verification channel
  const channel = db.get(`verify_${message.guild.id}`);
  if (channel && message.channel.id === channel) {
    if (!message.content.startsWith(config.prefix)) {
      message.delete().catch(() => {});
      return;
    }
  }

  if (!message.content.startsWith(config.prefix)) return;

  const args = message.content.slice(config.prefix.length).trim().split(/ +/g);
  const cmd = args.shift().toLowerCase();

  if (cmd.length === 0) return;

  const command = commands.get(cmd);
  if (command) {
    try {
      command.run(client, message, args);
    } catch (error) {
      console.error("Command error:", error);
      message.channel.send("Vixe, deu erro no comando.");
    }
  }
});

// Ready event
client.on("ready", () => {
  client.user.setStatus("dnd");
  console.log(`To logado em ${client.user.tag}`);
  console.log(`Loaded ${commands.size} commands`);
});

// Error handling
client.on("error", console.error);
process.on("unhandledRejection", console.error);

// Keep alive server
require("http")
  .createServer((req, res) =>
    res.end(`
 |-----------------------------------------|
 |              Informations               |
 |-----------------------------------------|
 |• Alive: 24/7                            |
 |-----------------------------------------|
 |• Author: lirolegal                      |
 |-----------------------------------------|
 |• Server: https://discord.gg/sintase     |
 |-----------------------------------------|
 |• Github: https://github.com/liroburro   |
 |-----------------------------------------|
 |• License: Apache License 2.0            |
 |-----------------------------------------|
`),
  )
  .listen(3000);

// Login
client.login(process.env.TOKEN);
