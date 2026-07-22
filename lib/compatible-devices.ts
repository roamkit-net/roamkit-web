export type DeviceBrand = {
  brand: string;
  devices: string[];
};

export type CompatibleDevices = {
  ios: DeviceBrand[];
  android: DeviceBrand[];
};

export type DevicePlatform = keyof CompatibleDevices;

/** Static eSIM-compatible device catalog (not from Airalo Partner API). */
export const compatibleDevices: CompatibleDevices = {
  ios: [
    {
      brand: "Apple",
      devices: [
        "iPad 10th Gen",
        "iPad 8th Gen (WiFi+Cellular)",
        "iPad Air 11-inch (M2)",
        "iPad Air 13-inch (M2)",
        "iPad Air 3rd Gen",
        "iPad air 4th Gen (WiFi+Cellular)",
        "iPad Air 5th Gen (WiFi+Cellular)",
        "iPad mini (6th Gen)",
        "iPad mini 5th Gen",
        "iPad Pro 11 inch 3rd Gen",
        "iPad Pro 11 inch 3rd Gen (1TB, WiFi+Cellular)",
        "iPad Pro 11 inch 3rd Gen (WiFi+Cellular)",
        "iPad Pro 11 inch 4th Gen",
        "iPad Pro 11 inch 4th Gen (WiFi+Cellular)",
        "iPad Pro 11-inch (M4)",
        "iPad Pro 12.9 inch 3rd Gen (1TB, WiFi+Cellular)",
        "iPad Pro 12.9 inch 3rd Gen (WiFi+Cellular)",
        "iPad Pro 12.9 inch 4th Gen (WiFi+Cellular)",
        "iPad Pro 12.9 inch 5th Gen",
        "iPad Pro 12.9 inch 6th Gen",
        "iPad Pro 13-inch (M4)",
        "iPhone 11",
        "iPhone 11 Pro",
        "iPhone 11 Pro Max",
        "iPhone 12",
        "iPhone 12 Mini",
        "iPhone 12 Pro",
        "iPhone 12 Pro Max",
        "iPhone 13",
        "iPhone 13 Mini",
        "iPhone 13 Pro",
        "iPhone 13 Pro Max",
        "iPhone 14",
        "iPhone 14 Plus",
        "iPhone 14 Pro",
        "iPhone 14 Pro Max",
        "iPhone 15",
        "iPhone 15 Plus",
        "iPhone 15 Pro",
        "iPhone 15 Pro Max",
        "iPhone 16",
        "iPhone 16 Plus",
        "iPhone 16 Pro",
        "iPhone 16 Pro Max",
        "iPhone 16e",
        "iPhone 17",
        "iPhone 17 Air",
        "iPhone 17 Pro",
        "iPhone 17 Pro Max",
        "iPhone Air",
        "iPhone SE 2nd Gen",
        "iPhone SE 3rd Gen",
        "iPhone XR",
        "iPhone XS",
        "iPhone XS Max",
        "iPhone XS Max Global",
      ],
    },
  ],
  android: [
    {
      brand: "ABCTECH",
      devices: [
        "X20",
      ],
    },
    {
      brand: "Alcatel",
      devices: [
        "V3 Ultra",
      ],
    },
    {
      brand: "ASUS",
      devices: [
        "ZenFone Max Pro M1 (ZB602KL) (WW) / Max Pro M1 (ZB601KL) (IN)",
        "ZenFone Max Pro M2 (ZB631KL) (WW) / Max Pro M2 (ZB630KL) (IN)",
        "ASUS Zenfone 12 Ultra",
      ],
    },
    {
      brand: "BALMUDA",
      devices: [
        "BALMUDA Phone",
      ],
    },
    {
      brand: "bq",
      devices: [
        "Aquaris X2",
        "Aquaris X2 PRO",
      ],
    },
    {
      brand: "CIBER",
      devices: [
        "B610A115",
      ],
    },
    {
      brand: "Covia",
      devices: [
        "CP-G3",
      ],
    },
    {
      brand: "DOOGEE",
      devices: [
        "V30",
      ],
    },
    {
      brand: "dtab",
      devices: [
        "dtab d-51C",
      ],
    },
    {
      brand: "Energizer",
      devices: [
        "Hardcase H620S",
      ],
    },
    {
      brand: "Evolveo",
      devices: [
        "EVOLVEO StrongPhone G9",
      ],
    },
    {
      brand: "Fairphone",
      devices: [
        "Fairphone4",
      ],
    },
    {
      brand: "FCNT",
      devices: [
        "arrows BZ03",
        "arrows N F-51C",
        "arrows We A101FC",
      ],
    },
    {
      brand: "Fossil",
      devices: [
        "Fossil Gen 5 LTE",
      ],
    },
    {
      brand: "Gigaset",
      devices: [
        "Gigaset GX4 PRO",
      ],
    },
    {
      brand: "Google",
      devices: [
        "Pixel 5a 5G",
        "Pixel 6",
        "Pixel 6 Pro",
        "Pixel 6a",
        "Pixel 7",
        "Pixel 7 Pro",
        "Google Pixel 10",
        "Google Pixel 10 Pro",
        "Google Pixel 10 Pro Fold",
        "Google Pixel 10 Pro XL",
        "Google Pixel 9a",
        "Pixel 2",
        "Pixel 2 XL",
        "Pixel 3",
        "Pixel 3 XL",
        "Pixel 3a",
        "Pixel 3a XL",
        "Pixel 4",
        "Pixel 4 XL",
        "Pixel 4a",
        "Pixel 4a (5G)",
        "Pixel 5",
        "Pixel 7a",
        "Pixel 8",
        "Pixel 8 Pro",
        "Pixel 9",
        "Pixel 9 Pro",
        "Pixel 9 Pro Fold",
        "Pixel 9 Pro XL",
        "Pixel Fold",
      ],
    },
    {
      brand: "Hamic",
      devices: [
        "MIELS",
      ],
    },
    {
      brand: "Hammer",
      devices: [
        "Hammer Blade 5G",
        "Hammer Construction",
      ],
    },
    {
      brand: "Honeywell",
      devices: [
        "CT30XP",
        "CT45 XP",
        "CT47",
        "EDA52",
        "EDA5S",
      ],
    },
    {
      brand: "Honor",
      devices: [
        "Honor 400",
        "Honor 400 Pro",
        "Honor 90",
        "Honor Magic4 Pro",
        "Honor Magic6 Pro",
        "Honor Magic8 Pro Air",
        "Magic8 Pro Air",
        "FRI",
        "HONOR Magic4 Pro",
        "HONOR Magic5 Pro",
      ],
    },
    {
      brand: "Hoozo",
      devices: [
        "HZ0010J",
      ],
    },
    {
      brand: "Huawei",
      devices: [
        "Mate 40 Pro",
        "P40",
        "P40 Pro",
      ],
    },
    {
      brand: "isafemobile",
      devices: [
        "IS540",
      ],
    },
    {
      brand: "KDDI",
      devices: [
        "AQUOS sense6s",
        "AQUOS sense7",
        "AQUOS wish2",
      ],
    },
    {
      brand: "KYOCERA",
      devices: [
        "Android One S10",
        "Android One S9",
        "DIGNO SANGA edition",
        "DIGNO SX2",
        "DIGNO SX3",
        "かんたんスマホ２",
        "かんたんスマホ2+",
        "かんたんスマホ3",
      ],
    },
    {
      brand: "Lenovo",
      devices: [
        "d-42A",
        "d-52C",
      ],
    },
    {
      brand: "LOGIC",
      devices: [
        "LOGIC MV01",
        "LOGIC MV02",
      ],
    },
    {
      brand: "Microsoft",
      devices: [
        "Surface Pro 11",
      ],
    },
    {
      brand: "MiTAC",
      devices: [
        "N630",
        "N672",
      ],
    },
    {
      brand: "Mobvoi",
      devices: [
        "TicWatch Pro 3 Cellular/LTE",
      ],
    },
    {
      brand: "Montblanc",
      devices: [
        "Summit 2+",
      ],
    },
    {
      brand: "Motorola",
      devices: [
        "moto g52j 5G",
        "moto g53y 5G",
        "motorola razr 2022",
        "Edge 40",
        "Edge 40 Neo",
        "Edge 40 Pro",
        "Edge 60",
        "Edge 60 Fusion",
        "Edge 60 Pro",
        "Edge+ Plus",
        "Edge+ Plus (2022)",
        "Moto G53",
        "Moto G53 5G",
        "Moto G54",
        "Motorola Moto G Power (2026)",
        "motorola razr",
        "Motorola Razr (2025)",
        "motorola razr 5G",
        "Motorola Razr 60",
        "Motorola Razr 60 Ultra",
        "Motorola Razr Fold",
        "Motorola Razr+ (2025)",
        "Razr 2022",
        "Razr 40 Ultra",
        "Razr 50 Ultra",
        "Signature",
      ],
    },
    {
      brand: "Motorola Solutions",
      devices: [
        "MOTOTRBO ION",
      ],
    },
    {
      brand: "Myphone",
      devices: [
        "Hammer Blade 3",
        "Hammer Explorer Pro",
        "myPhone Now eSIM",
      ],
    },
    {
      brand: "MyPhone (PL)",
      devices: [
        "Hammer_Explorer",
      ],
    },
    {
      brand: "Nokia",
      devices: [
        "Nokia G60 5G",
        "Nokia X30 5G",
        "XR21",
      ],
    },
    {
      brand: "Nothing",
      devices: [
        "Nothing Phone 3a Pro",
        "Phone (3)",
        "Phone Pro",
      ],
    },
    {
      brand: "OnePlus",
      devices: [
        "13R",
        "13T",
        "OnePlus 11 5G",
        "OnePlus 12",
        "OnePlus 15",
      ],
    },
    {
      brand: "Oppo",
      devices: [
        "Find N5",
        "Find X3 Pro",
        "Oppo Find X9",
        "Oppo Find X9 Pro",
        "Oppo Reno 15 Pro",
        "Oppo Reno 15 Pro Max",
        "OPPO Watch",
        "Reno14",
        "Reno14 Pro",
        "Reno15",
        "Reno15 FS",
        "Reno15 Pro Max",
        "A5",
        "A55s 5G",
        "A77",
        "CPH2247",
        "Find N2 Flip",
        "Find X5",
        "Find X5 Pro",
        "OPPO Reno5 A",
        "OPPO Reno7 A",
        "Premier",
        "TAB-7304-16G3GS",
      ],
    },
    {
      brand: "Rakuten",
      devices: [
        "C330",
        "Rakuten BIG s",
        "Rakuten Hand",
        "Rakuten Hand5G",
        "AQUOS sense6",
      ],
    },
    {
      brand: "Razer",
      devices: [
        "Razer Edge 5G",
      ],
    },
    {
      brand: "RealMe",
      devices: [
        "14 Pro+",
        "GT 7",
        "Realme 14 Pro+",
        "RMX5070",
      ],
    },
    {
      brand: "Samsung",
      devices: [
        "Galaxy A23 5G",
        "Galaxy S22",
        "Galaxy S22 Ultra",
        "Galaxy S22+",
        "Galaxy S23",
        "Galaxy S23 Ultra",
        "Galaxy S23+",
        "Galaxy Z Flip4",
        "Galaxy Z Fold4",
        "A35",
        "A36",
        "Galaxy 24 FE",
        "Galaxy A54 5G",
        "Galaxy A55",
        "Galaxy A56",
        "Galaxy Flip 5",
        "Galaxy Flip7",
        "Galaxy Fold 5",
        "Galaxy Note20",
        "Galaxy Note20 5G",
        "Galaxy Note20 Ultra",
        "Galaxy Note20 Ultra 5G",
        "Galaxy S20 5G",
        "Galaxy S20 Ultra 5G",
        "Galaxy S20+ 5G",
        "Galaxy S21 5G",
        "Galaxy S21 Ultra 5G",
        "Galaxy S21+ 5G",
        "Galaxy S22 5G",
        "Galaxy S22 Ultra 5G",
        "Galaxy S22+ 5G",
        "Galaxy S23 FE",
        "Galaxy S24",
        "Galaxy S24 Ultra",
        "Galaxy S24+",
        "Galaxy S25",
        "Galaxy S25 Edge",
        "Galaxy S25 Slim",
        "Galaxy S25 Ultra",
        "Galaxy S25+",
        "Galaxy Watch Ultra",
        "Galaxy Watch4",
        "Galaxy Watch4 Classic",
        "Galaxy Watch7 (LTE)",
        "Galaxy XCover7 Pro",
        "Galaxy Z Flip",
        "Galaxy Z Flip 5G",
        "Galaxy Z Flip3 5G",
        "Galaxy Z Flip7 FE",
        "Galaxy Z Fold",
        "Galaxy Z Fold2",
        "Galaxy Z Fold3",
        "Galaxy Z Fold7",
        "Samsung Galaxy S26",
        "Samsung Galaxy S26 Ultra",
        "Samsung Galaxy S26+",
        "Samsung Galaxy Z Flip 7",
        "Samsung Galaxy Z Fold 7",
        "Samsung Galaxy Z TriFold",
      ],
    },
    {
      brand: "SG",
      devices: [
        "AQUOS R6",
        "AQUOS R7",
        "AQUOS sense7 plus",
        "Leitz Phone 2",
        "シンプルスマホ６",
      ],
    },
    {
      brand: "SGIN",
      devices: [
        "SGIN_E10M",
      ],
    },
    {
      brand: "Sharp",
      devices: [
        "AQUOS sense4 lite SH-RM15",
        "Aquos Sense6",
        "Aquos wish5",
        "Aquos Wish6",
        "Aquos Zero6",
        "SH-51F",
        "AQUOS wish",
        "AQUOS zero6",
      ],
    },
    {
      brand: "Sony",
      devices: [
        "Sony Xperia 1 VII",
        "Sony Xperia 10 VI",
        "Xperia 1 IV",
        "Xperia 1 V",
        "Xperia 1 VII",
        "Xperia 10 III Lite",
        "Xperia 10 IV",
        "Xperia 5 IV",
        "Xperia Ace III",
      ],
    },
    {
      brand: "Surface",
      devices: [
        "Surface Duo 2",
        "Surface Duo",
        "Surface Pro 9",
      ],
    },
    {
      brand: "T-Mobile",
      devices: [
        "T-Mobile Revvl 7 Pro",
      ],
    },
    {
      brand: "TAG-TECH",
      devices: [
        "TAG-TAB-III",
      ],
    },
    {
      brand: "TCL",
      devices: [
        "60 XE NxtPaper",
        "NxtPaper 70 Pro",
      ],
    },
    {
      brand: "Teclast",
      devices: [
        "X_EEA",
      ],
    },
    {
      brand: "TONE",
      devices: [
        "TONE_e22",
      ],
    },
    {
      brand: "VIKUSHA",
      devices: [
        "V-Z40",
      ],
    },
    {
      brand: "Vivo",
      devices: [
        "V29",
        "V29 Lite 5G",
        "X100 Pro",
        "X200s",
        "X90 Pro",
        "V40",
        "V50",
        "Vivo V50",
        "Vivo X300",
        "Vivo X300 Pro",
        "X200",
        "X200 Pro",
        "X200T",
      ],
    },
    {
      brand: "Vsmart",
      devices: [
        "Active 1",
      ],
    },
    {
      brand: "Xiaomi",
      devices: [
        "15 Ultra",
        "Redmi Note 11 Pro 5G",
        "Redmi Note 13 Pro",
        "Redmi Note 13 Pro+",
        "Redmi Note 14 Pro",
        "Redmi Note 14 Pro 5G",
        "Redmi Note 14 Pro+",
        "Redmi Note 14 Pro+ 5G",
        "Xiaomi 12T Pro",
        "Xiaomi 13",
        "Xiaomi 13 Lite",
        "Xiaomi 13 Pro",
        "Xiaomi 13T",
        "Xiaomi 13T Pro",
        "Xiaomi 14",
        "Xiaomi 14 Pro",
        "Xiaomi 14 Ultra",
        "Xiaomi 14T",
        "Xiaomi 14T Pro",
        "Xiaomi 15",
        "Xiaomi 15 Ultra",
        "Xiaomi 15T",
        "Xiaomi 15T Pro",
        "Xiaomi Poco F8 Ultra",
        "Xiaomi Poco X7",
      ],
    },
    {
      brand: "Zebra",
      devices: [
        "EC55",
        "ET56",
        "TC26",
        "TC57",
        "TC58",
        "TC77",
        "Zebra Technologies L10",
        "Zebra Technologies MC2700",
        "Zebra Technologies TC57x",
      ],
    },
    {
      brand: "ZONKO",
      devices: [
        "K105_EEA",
      ],
    },
    {
      brand: "ZTE",
      devices: [
        "A103ZT",
        "A202ZT",
        "RAKUTEN BIG",
        "ZR01",
        "ZTE nubia Flip2",
      ],
    },
  ],
};

/** Filter brands/devices by search query (matches brand or device name). */
export function filterCompatibleDevices(
  brands: DeviceBrand[],
  query: string,
): DeviceBrand[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) {
    return brands;
  }
  const result: DeviceBrand[] = [];
  for (const group of brands) {
    const brandMatch = group.brand.toLowerCase().includes(normalized);
    if (brandMatch) {
      result.push(group);
      continue;
    }
    const devices = group.devices.filter((device) =>
      device.toLowerCase().includes(normalized),
    );
    if (devices.length > 0) {
      result.push({ brand: group.brand, devices });
    }
  }
  return result;
}

