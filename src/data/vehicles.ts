import { VehicleDefinition, ZoneId } from "../../types";

type VehicleSeed = {
  id: string;
  emoji: string;
  label: string;
  article: string;
  color: string;
  phrase: string;
  preferredZone: ZoneId;
  advancedPrompts?: string[];
};

const VEHICLE_SEEDS: VehicleSeed[] = [
  {
    id: "bus",
    emoji: "🚌",
    label: "Bus",
    article: "Der",
    phrase: "fährt auf der Straße",
    color: "#ff8f5a",
    preferredZone: "road",
  },
  {
    id: "auto",
    emoji: "🚗",
    label: "Auto",
    article: "Das",
    phrase: "fährt schnell",
    color: "#ff738a",
    preferredZone: "road",
  },
  {
    id: "taxi",
    emoji: "🚕",
    label: "Taxi",
    article: "Das",
    phrase: "holt Menschen ab",
    color: "#ffd55c",
    preferredZone: "road",
  },
  {
    id: "polizei",
    emoji: "🚓",
    label: "Polizeiauto",
    article: "Das",
    phrase: "fährt durch die Stadt",
    color: "#8cbcff",
    preferredZone: "road",
  },
  {
    id: "feuerwehr",
    emoji: "🚒",
    label: "Feuerwehrauto",
    article: "Das",
    phrase: "hilft schnell",
    color: "#ff6d5f",
    preferredZone: "road",
  },
  {
    id: "fahrrad",
    emoji: "🚲",
    label: "Fahrrad",
    article: "Das",
    phrase: "rollt leise",
    color: "#4fd1c5",
    preferredZone: "road",
  },
  {
    id: "flugzeug",
    emoji: "✈️",
    label: "Flugzeug",
    article: "Das",
    phrase: "fliegt im Himmel",
    color: "#90e0ef",
    preferredZone: "sky",
  },
  {
    id: "hubschrauber",
    emoji: "🚁",
    label: "Hubschrauber",
    article: "Der",
    phrase: "summt in der Luft",
    color: "#91f2b3",
    preferredZone: "sky",
  },
  {
    id: "rakete",
    emoji: "🚀",
    label: "Rakete",
    article: "Die",
    phrase: "fliegt hoch",
    color: "#b08cff",
    preferredZone: "sky",
  },
  {
    id: "heissluftballon",
    emoji: "🎈",
    label: "Ballon",
    article: "Der",
    phrase: "schwebt langsam",
    color: "#ffa6c9",
    preferredZone: "sky",
  },
  {
    id: "ufo",
    emoji: "🛸",
    label: "Ufo",
    article: "Das",
    phrase: "glitzert am Himmel",
    color: "#7ee0ff",
    preferredZone: "sky",
  },
  {
    id: "gleitschirm",
    emoji: "🪂",
    label: "Fallschirm",
    article: "Der",
    phrase: "schwebt herunter",
    color: "#ffb86b",
    preferredZone: "sky",
  },
  {
    id: "zug",
    emoji: "🚆",
    label: "Zug",
    article: "Der",
    phrase: "fährt auf der Schiene",
    color: "#ff6b6b",
    preferredZone: "track",
  },
  {
    id: "strassenbahn",
    emoji: "🚋",
    label: "Straßenbahn",
    article: "Die",
    phrase: "fährt durch die Stadt",
    color: "#ff9671",
    preferredZone: "track",
  },
  {
    id: "u-bahn",
    emoji: "🚇",
    label: "U-Bahn",
    article: "Die",
    phrase: "fährt unter der Erde",
    color: "#6aa9ff",
    preferredZone: "track",
  },
  {
    id: "lok",
    emoji: "🚂",
    label: "Lok",
    article: "Die",
    phrase: "zieht viele Wagen",
    color: "#6d5bd0",
    preferredZone: "track",
  },
  {
    id: "monorail",
    emoji: "🚝",
    label: "Bahn",
    article: "Die",
    phrase: "gleitet auf der Schiene",
    color: "#6fd08c",
    preferredZone: "track",
  },
  {
    id: "hochgeschwindigkeitszug",
    emoji: "🚄",
    label: "Schnellzug",
    article: "Der",
    phrase: "saust sehr schnell",
    color: "#ff7f7f",
    preferredZone: "track",
  },
];

export const VEHICLES: VehicleDefinition[] = VEHICLE_SEEDS.map((vehicle) =>
  createVehicleDefinition(vehicle),
);

function createVehicleDefinition(vehicle: VehicleSeed): VehicleDefinition {
  const speechName = `${vehicle.article} ${vehicle.label}`;

  return {
    id: vehicle.id,
    emoji: vehicle.emoji,
    label: vehicle.label,
    speechName,
    questionPrompt: `Wo ist ${speechName.toLowerCase()}?`,
    advancedPrompts: vehicle.advancedPrompts ?? [
      `Wo ist ${speechName.toLowerCase()}?`,
      `Tippe auf ${speechName.toLowerCase()}.`,
      getZonePrompt(vehicle.preferredZone),
    ],
    phrase: `${speechName} ${vehicle.phrase}`,
    color: vehicle.color,
    preferredZone: vehicle.preferredZone,
  };
}

function getZonePrompt(zone: ZoneId) {
  if (zone === "sky") {
    return "Welches fliegt im Himmel?";
  }

  if (zone === "track") {
    return "Welches fährt auf der Schiene?";
  }

  return "Welches fährt auf der Straße?";
}
