const { Client, Intents, MessageEmbed } = require("discord.js");
const fs = require("fs");
const path = require("path");

// Load configuration
const config = JSON.parse(fs.readFileSync(path.join(__dirname, "config.json"), "utf8"));

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
  intents: [
    Intents.FLAGS.GUILDS, 
    Intents.FLAGS.GUILD_MESSAGES,
    Intents.FLAGS.GUILD_MEMBERS
  ],
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
        `**📋 Comandos de Verificação:**
> \`${config.prefix}setverify\`: Setar o canal de verificação
> \`${config.prefix}setrole\`: Setar o cargo que será dado quando verificar
> \`${config.prefix}setrrole\`: Setar o cargo de random
> \`${config.prefix}verify\`: Verificar
> \`${config.prefix}rvrole\`: Resetar o cargo de verificação
> \`${config.prefix}rvchannel\`: Resetar o canal de verificação
> \`${config.prefix}rrvrole\`: Resetar o cargo de random
> \`${config.prefix}resetallverify\`: Remover cargo de verificação de todos os membros

**🎉 Comandos de Boas-Vindas:**
> \`${config.prefix}great\`: Abrir painel de configuração de boas-vindas
> \`${config.prefix}setwelcome\`: Definir canal de boas-vindas
> \`${config.prefix}setwelcomerole\`: Definir cargo automático
> \`${config.prefix}setautodelete\`: Configurar auto-delete
> \`${config.prefix}testwelcome\`: Testar mensagem de boas-vindas
> \`${config.prefix}resetwelcome\`: Resetar configurações de boas-vindas`,
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
        "Você não tem permissão para usar este comando.",
      );
    }
    const channel = message.mentions.channels.first();
    if (!channel) {
      return message.channel.send(
        "Por favor, mencione o canal de verificação.",
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
        "Você não tem permissão para usar este comando.",
      );
    }
    const role = message.mentions.roles.first();
    if (!role) {
      return message.channel.send(
        "Por favor, mencione o cargo que será dado na verificação.",
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
        "Você não tem permissão para usar este comando.",
      );
    }
    const role = message.mentions.roles.first();
    if (!role) {
      return message.channel.send(
        "Por favor, mencione o cargo que será removido na verificação.",
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
        "Canal de verificação não configurado. Use `.setverify #channel` para configurar.",
      );
    }

    if (message.channel.id !== chx) {
      return; // Only work in verification channel
    }

    if (!rRole) {
      return message.channel.send(
        "O cargo de verificação não foi configurado. Use `.setrole @role` para configurar.",
      );
    }

    const myRole = message.guild.roles.cache.get(rRole);
    if (!myRole) {
      return message.channel.send(
        "O cargo de verificação não existe mais. Entre em contato com um administrador.",
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
        .send(`Você foi verificado(a) em ${message.guild.name}`)
        .catch(() => {
          message.channel.send(
            `${message.member}, você foi verificado em ${message.guild.name}, porém não foi possível enviar uma mensagem privada. Verifique suas configurações de privacidade.`,
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
        "Você não tem permissão para usar este comando.",
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
        "Você não tem permissão para usar este comando.",
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
        "Você não tem permissão para usar este comando.",
      );
    }
    db.delete(`srrole_${message.guild.id}`);
    message.channel.send("O cargo de random foi resetado");
  },
});

// Reset all verified members
commands.set("resetallverify", {
  run: async (client, message, args) => {
    if (!message.member.permissions.has("ADMINISTRATOR")) {
      return message.channel.send(
        "Você não tem permissão para usar este comando.",
      );
    }

    const verificationRoleId = db.get(`verole_${message.guild.id}`);
    if (!verificationRoleId) {
      return message.channel.send(
        "❌ Cargo de verificação não configurado. Use `.setrole @cargo` primeiro.",
      );
    }

    const verificationRole = message.guild.roles.cache.get(verificationRoleId);
    if (!verificationRole) {
      return message.channel.send(
        "❌ Cargo de verificação não encontrado. Verifique se ainda existe.",
      );
    }

    const statusMessage = await message.channel.send("⏳ Processando... Removendo cargo de verificação de todos os membros...");

    try {
      // Get all members with the verification role
      await message.guild.members.fetch();
      const membersWithRole = message.guild.members.cache.filter(member => 
        member.roles.cache.has(verificationRoleId)
      );

      if (membersWithRole.size === 0) {
        return statusMessage.edit("ℹ️ Nenhum membro possui o cargo de verificação.");
      }

      let successCount = 0;
      let errorCount = 0;

      // Remove role from all members
      for (const [memberId, member] of membersWithRole) {
        try {
          await member.roles.remove(verificationRole);
          successCount++;
        } catch (error) {
          console.error(`Erro ao remover cargo do membro ${member.user.tag}:`, error);
          errorCount++;
        }
      }

      const embed = new MessageEmbed()
        .setTitle("✅ Reset de Verificação Concluído")
        .setDescription(
          `**Resultados da operação:**
          
🎯 **Total de membros processados:** ${membersWithRole.size}
✅ **Cargos removidos com sucesso:** ${successCount}
❌ **Erros encontrados:** ${errorCount}

${errorCount > 0 ? '⚠️ Alguns erros podem ser devido a permissões ou membros que saíram do servidor.' : '🎉 Todos os cargos foram removidos com sucesso!'}`
        )
        .setColor(errorCount > 0 ? "#ff9900" : "#00ff00")
        .setTimestamp();

      await statusMessage.edit({ content: null, embeds: [embed] });

    } catch (error) {
      console.error("Erro durante reset de verificação:", error);
      await statusMessage.edit("❌ Erro durante o processo. Verifique as permissões do bot e tente novamente.");
    }
  },
});

// Welcome system configuration
commands.set("great", {
  run: async (client, message, args) => {
    if (!message.member.permissions.has("ADMINISTRATOR")) {
      return message.channel.send(
        "você não tem permissão para usar este comando.",
      );
    }

    const embed = new MessageEmbed()
      .setTitle("painel de Controle - sistema de boas-vindas")
      .setDescription(
        `**status das configurações:**
        
**canal de boas-vindas:**
> ${await getWelcomeChannelText(message.guild.id, client)}

**cargo automático:**
> ${await getWelcomeRoleText(message.guild.id, client)}

**auto-delete:**
> ${getWelcomeDeleteText(message.guild.id)}

**comandos de configuração:**
> \`${config.prefix}setwelcome #canal\` - Definir canal de boas-vindas
> \`${config.prefix}setwelcomerole @cargo\` - Definir cargo automático  
> \`${config.prefix}setautodelete 10\` - Auto-delete após X segundos (0 = desabilitado)
> \`${config.prefix}testwelcome\` - Testar sistema de boas-vindas
> \`${config.prefix}resetwelcome\` - Resetar todas as configurações

**💡 Dica:** Use os comandos acima para configurar seu sistema de boas-vindas personalizado!

**aliases Disponíveis:** \`sw\`, \`swr\`, \`sad\`, \`tw\`, \`rw\`
**para ver todos os comandos:** \`${config.prefix}help\`"`
      )
      .setColor("#000000")
      .setTimestamp()
      .setFooter("painel de Controle Interativo");

    message.channel.send({ embeds: [embed] });
  },
});

// Set welcome channel
commands.set("setwelcome", {
  run: (client, message, args) => {
    if (!message.member.permissions.has("ADMINISTRATOR")) {
      return message.channel.send(
        "você não tem permissão para usar este comando.",
      );
    }
    const channel = message.mentions.channels.first();
    if (!channel) {
      return message.channel.send(
        "por favor, mencione o canal onde as mensagens de boas-vindas serão enviadas.",
      );
    }
    db.set(`welcome_channel_${message.guild.id}`, channel.id);
    message.channel.send(
      `Canal de boas-vindas definido para ${channel}`,
    );
  },
});

// Set welcome role
commands.set("setwelcomerole", {
  run: (client, message, args) => {
    if (!message.member.permissions.has("ADMINISTRATOR")) {
      return message.channel.send(
        "Você não tem permissão para usar este comando, verme.",
      );
    }
    const role = message.mentions.roles.first();
    if (!role) {
      return message.channel.send(
        "Por favor, mencione o cargo que será dado automaticamente aos novos membros.",
      );
    }
    db.set(`welcome_role_${message.guild.id}`, role.id);
    message.channel.send(
      `Cargo automático definido para \`${role.name}\``,
    );
  },
});

// Set auto-delete time
commands.set("setautodelete", {
  run: (client, message, args) => {
    if (!message.member.permissions.has("ADMINISTRATOR")) {
      return message.channel.send(
        "Você não tem permissão para usar este comando.",
      );
    }
    const seconds = parseInt(args[0]);
    if (isNaN(seconds) || seconds < 0) {
      return message.channel.send(
        "Por favor, forneça um número válido de segundos (0 para desabilitar auto-delete).",
      );
    }
    if (seconds > 300) {
      return message.channel.send(
        "O tempo máximo para auto-delete é 300 segundos (5 minutos).",
      );
    }
    
    if (seconds === 0) {
      db.delete(`welcome_autodelete_${message.guild.id}`);
      message.channel.send("✅ Auto-delete desabilitado para mensagens de boas-vindas.");
    } else {
      db.set(`welcome_autodelete_${message.guild.id}`, seconds);
      message.channel.send(
        `✅ Auto-delete definido para ${seconds} segundos.`,
      );
    }
  },
});

// Reset welcome settings
commands.set("resetwelcome", {
  run: (client, message, args) => {
    if (!message.member.permissions.has("ADMINISTRATOR")) {
      return message.channel.send(
        "Você não tem permissão para usar este comando.",
      );
    }
    db.delete(`welcome_channel_${message.guild.id}`);
    db.delete(`welcome_role_${message.guild.id}`);
    db.delete(`welcome_autodelete_${message.guild.id}`);
    message.channel.send("✅ Todas as configurações de boas-vindas foram resetadas.");
  },
});

// Test welcome message
commands.set("testwelcome", {
  run: async (client, message, args) => {
    if (!message.member.permissions.has("ADMINISTRATOR")) {
      return message.channel.send(
        "Você não tem permissão para usar este comando.",
      );
    }
    
    const welcomeChannelId = db.get(`welcome_channel_${message.guild.id}`);
    if (!welcomeChannelId) {
      return message.channel.send(
        "❌ Canal de boas-vindas não configurado. Use `.setwelcome #canal` primeiro.",
      );
    }
    
    const welcomeChannel = client.channels.cache.get(welcomeChannelId);
    if (!welcomeChannel) {
      return message.channel.send(
        "❌ Canal de boas-vindas não encontrado. Verifique se ainda existe.",
      );
    }
    
    await sendWelcomeMessage(client, message.member, true);
    message.channel.send("✅ Mensagem de teste enviada!");
  },
});

// Welcome command aliases (must be after all commands are defined)
commands.set("sw", commands.get("setwelcome"));
commands.set("swr", commands.get("setwelcomerole"));
commands.set("sad", commands.get("setautodelete"));
commands.set("tw", commands.get("testwelcome"));
commands.set("rw", commands.get("resetwelcome"));

// Reset verification alias
commands.set("rav", commands.get("resetallverify"));

// Helper functions
async function getWelcomeChannelText(guildId, client) {
  const channelId = db.get(`welcome_channel_${guildId}`);
  if (!channelId) return "Não configurado";
  const channel = client.channels.cache.get(channelId);
  return channel ? `${channel}` : "Canal não encontrado";
}

async function getWelcomeRoleText(guildId, client) {
  const roleId = db.get(`welcome_role_${guildId}`);
  if (!roleId) return "Não configurado";
  const guild = client.guilds.cache.get(guildId);
  if (!guild) return "Servidor não encontrado";
  const role = guild.roles.cache.get(roleId);
  return role ? role.name : "Cargo não encontrado";
}

function getWelcomeDeleteText(guildId) {
  const seconds = db.get(`welcome_autodelete_${guildId}`);
  return seconds ? `${seconds} segundos` : "Desabilitado";
}

async function sendWelcomeMessage(client, member, isTest = false) {
  const guildId = member.guild.id;
  const welcomeChannelId = db.get(`welcome_channel_${guildId}`);
  
  if (!welcomeChannelId) return;
  
  const welcomeChannel = client.channels.cache.get(welcomeChannelId);
  if (!welcomeChannel) return;
  
  const embed = new MessageEmbed()
    .setTitle("🎉 Bem-vindo(a)!")
    .setDescription(
      `Olá ${member}! Seja muito bem-vindo(a) ao **${member.guild.name}**!
      
Esperamos que você se divirta aqui! 🎊`
    )
    .setColor("#00ff00")
    .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
    .setTimestamp()
    .setFooter(isTest ? "Esta é uma mensagem de teste" : `Membro #${member.guild.memberCount}`);

  try {
    const welcomeMsg = await welcomeChannel.send({ embeds: [embed] });
    
    // Auto-delete if configured
    const autoDeleteSeconds = db.get(`welcome_autodelete_${guildId}`);
    if (autoDeleteSeconds && autoDeleteSeconds > 0) {
      setTimeout(() => {
        welcomeMsg.delete().catch(() => {});
      }, autoDeleteSeconds * 1000);
    }
    
    // Add welcome role if configured
    const welcomeRoleId = db.get(`welcome_role_${guildId}`);
    if (welcomeRoleId && !isTest) {
      const welcomeRole = member.guild.roles.cache.get(welcomeRoleId);
      if (welcomeRole) {
        await member.roles.add(welcomeRole).catch(() => {});
      }
    }
  } catch (error) {
    console.error("Erro ao enviar mensagem de boas-vindas:", error);
  }
}

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
      message.channel.send("Ocorreu um erro ao executar o comando.");
    }
  }
});

// Guild member add event (welcome system)
client.on("guildMemberAdd", async (member) => {
  await sendWelcomeMessage(client, member);
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
  .listen(5000);

// Login
client.login(process.env.TOKEN);





