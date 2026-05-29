/*
 * FSAE school name canonicalization.
 *
 * This intentionally mirrors the documented pipeline:
 * raw_school_name -> normalized_key -> canonical_school + status/car metadata.
 * The dashboard currently uses cleanTeamName(), but the full result is exposed
 * as canonicalizeSchoolName() for review/export workflows.
 */
(function () {
  const SPELLING_FIXES = {
    univeristy: "university",
    univerity: "university",
    universityersitario: "universitario",
    insitute: "institute",
    illionois: "illinois",
    saskathcewan: "saskatchewan",
    okangan: "okanagan",
    edwardville: "edwardsville",
    plateville: "platteville",
    villnova: "villanova",
    collge: "college",
    tlalnepa: "tlalnepantla",
    mayaquez: "mayaguez",
    "nacion autonoma": "nacional autonoma",
    "san luis obis": "san luis obispo",
    "sao carlos usp": "sao carlos usp",
    tecnologico: "tecnologico",
    technologico: "tecnologico",
  };

  const ABBREVIATION_REPLACEMENTS = [
    [/\buniv\b/g, "university"],
    [/\bu\.\b/g, "university"],
    [/\binst\b/g, "institute"],
    [/\btech\b/g, "technology"],
    [/\btechnological university\b/g, "technological university"],
    [/\bengrg\b/g, "engineering"],
    [/\bengg\b/g, "engineering"],
    [/\bcoll\b/g, "college"],
    [/\bclg\b/g, "college"],
    [/\bcomm\b/g, "community"],
    [/\bsch\b/g, "school"],
    [/\bsci\b/g, "science"],
    [/\badv\b/g, "advancement"],
    [/\bcalif\b/g, "california"],
    [/\baero\b/g, "aeronautical"],
    [/\bbch\b/g, "beach"],
    [/\bpoly\b/g, "polytechnic"],
  ];

  const CAMPUS_ALIASES = {
    "w lafayette": "West Lafayette",
    "w. lafayette": "West Lafayette",
    "west lafayette": "West Lafayette",
    "urbana champaign": "Urbana-Champaign",
    "urbana-champaign": "Urbana-Champaign",
    "urbana/champaign": "Urbana-Champaign",
    "college station": "College Station",
    "ann arbor": "Ann Arbor",
    dearborn: "Dearborn",
    "twin cities": "Twin Cities",
    minneapolis: "Twin Cities",
    duluth: "Duluth",
    madison: "Madison",
    platteville: "Platteville",
    boulder: "Boulder",
    denver: "Denver",
    "colorado springs": "Colorado Springs",
    mayaguez: "Mayaguez",
    raleigh: "Raleigh",
    tempe: "Tempe",
    pomona: "Pomona",
    "san luis obispo": "San Luis Obispo",
    slo: "San Luis Obispo",
    fresno: "Fresno",
    "long beach": "Long Beach",
    northridge: "Northridge",
    sacramento: "Sacramento",
    fullerton: "Fullerton",
    chico: "Chico",
    "los angeles": "Los Angeles",
    carbondale: "Carbondale",
    edwardsville: "Edwardsville",
    okangan: "Okanagan",
    okanagan: "Okanagan",
  };

  const ALIASES = {
    "agh university of science and technology": "AGH University of Science and Technology",
    "alabama a&m university": "Alabama A&M University",
    "american university of sharjah": "American University of Sharjah",
    "amity school of engineering and technology": "Amity School of Engineering and Technology",
    "arizona state university": "Arizona State University - Tempe",
    "arizona state university tempe": "Arizona State University - Tempe",
    "auburn university": "Auburn University",
    "ba ravensburg friedrichshafen": "BA Ravensburg-Friedrichshafen",
    "bialystok university of technology": "Bialystok University of Technology",
    "binghamton university": "Binghamton University",
    "bits pilani dubai": "BITS Pilani - Dubai",
    "bradley university": "Bradley University",
    "brigham young university": "Brigham Young University",
    "brown university": "Brown University",
    "brunel university": "Brunel University",
    "cal poly pomona": "California State Polytechnic University - Pomona",
    "cal polytechnic pomona": "California State Polytechnic University - Pomona",
    "california state poly university pomona": "California State Polytechnic University - Pomona",
    "california state polytechnic university pomona": "California State Polytechnic University - Pomona",
    "cal poly san luis obispo": "California Polytechnic State University - San Luis Obispo",
    "cal poly slo": "California Polytechnic State University - San Luis Obispo",
    "cal polytechnic slo": "California Polytechnic State University - San Luis Obispo",
    "california polytechnic state university slo": "California Polytechnic State University - San Luis Obispo",
    "california state poly university san luis obispo": "California Polytechnic State University - San Luis Obispo",
    "california state polytechnic university san luis obispo": "California Polytechnic State University - San Luis Obispo",
    "california baptist university": "California Baptist University",
    "california institute of technology": "California Institute of Technology",
    "california state university chico": "California State University - Chico",
    "california state university fresno": "California State University - Fresno",
    "california state university fullerton": "California State University - Fullerton",
    "california state university long beach": "California State University - Long Beach",
    "california state university los angeles": "California State University - Los Angeles",
    "california state university northridge": "California State University - Northridge",
    "california state university sacramento": "California State University - Sacramento",
    "cal state university chico": "California State University - Chico",
    "cal state university fresno": "California State University - Fresno",
    "cal state university fullerton": "California State University - Fullerton",
    "cal state university long beach": "California State University - Long Beach",
    "cal state university los angeles": "California State University - Los Angeles",
    "cal state university northridge": "California State University - Northridge",
    "cal state university sacramento": "California State University - Sacramento",
    "calvin college": "Calvin College",
    "carleton university": "Carleton University",
    "carnegie mellon university": "Carnegie Mellon University",
    "case western reserve university": "Case Western Reserve University",
    "cedarville university": "Cedarville University",
    "cefet mg": "CEFET-MG",
    "cegep du vieux montreal": "Cégep du Vieux Montréal",
    "central connecticut state university": "Central Connecticut State University",
    "central michigan university": "Central Michigan University",
    "central piedmont community college": "Central Piedmont Community College",
    "centro universitario da fei": "Centro Universitário FEI",
    "centro universitario fei": "Centro Universitário FEI",
    "chalmers university of technology": "Chalmers University of Technology",
    "chandigarh engineering college": "Chandigarh Engineering College",
    "chitkara institute of engineering and technology": "Chitkara Institute of Engineering and Technology",
    "chungbuk national university": "Chungbuk National University",
    "city college of the city university of new york": "City College of New York",
    "clarkson university": "Clarkson University",
    "clemson university": "Clemson University",
    "coburg university of applied sciences": "Coburg University of Applied Sciences",
    "colorado mesa university": "Colorado Mesa University",
    "colorado school of mines": "Colorado School of Mines",
    "colorado state university": "Colorado State University",
    "columbia university": "Columbia University",
    "concordia university": "Concordia University",
    "cooper union": "Cooper Union",
    "cooper union for advancement of science and art": "Cooper Union",
    "cornell university": "Cornell University",
    "czech technical university of prague": "Czech Technical University in Prague",
    "dalhousie university": "Dalhousie University",
    "dartmouth college": "Dartmouth College",
    "delft university of technology": "Delft University of Technology",
    "drexel university": "Drexel University",
    "duke university": "Duke University",
    "ecole de technologie superieure": "École de technologie supérieure",
    "ecole national d'aerotechnique": "École nationale d'aérotechnique",
    "ecole national d aerotechnique": "École nationale d'aérotechnique",
    "ecole polytechnique de montreal": "Polytechnique Montréal",
    "ecole polytechnique montreal": "Polytechnique Montréal",
    "montreal polytechnique": "Polytechnique Montréal",
    "polytechnique montreal": "Polytechnique Montréal",
    "embry riddle aeronautical university": "Embry-Riddle Aeronautical University",
    "embry riddle aeronautical university daytona beach": "Embry-Riddle Aeronautical University - Daytona Beach",
    "escola de engineering de sao carlos usp": "Universidade de São Paulo - São Carlos",
    "escola de engenharia de sao carlos usp": "Universidade de São Paulo - São Carlos",
    "famu fsu college of engineering": "FAMU-FSU College of Engineering",
    "florida a&m university florida state university": "FAMU-FSU College of Engineering",
    "fanshawe college": "Fanshawe College",
    "fanshawe college of applied arts and technology": "Fanshawe College",
    "ferris state university": "Ferris State University",
    "fh joanneum graz": "FH Joanneum - Graz",
    "florida atlantic university": "Florida Atlantic University",
    "florida institute of technology": "Florida Institute of Technology",
    "florida international university": "Florida International University",
    "friedrich alexander university of erlangen": "Friedrich-Alexander University Erlangen-Nürnberg",
    "georgia institute of technology": "Georgia Institute of Technology",
    "georgia insitute of technology": "Georgia Institute of Technology",
    "georgia southern college": "Georgia Southern University",
    "georgia southern university": "Georgia Southern University",
    "grand canyon university": "Grand Canyon University",
    "grand valley state university": "Grand Valley State University",
    "graz technical university": "Graz University of Technology",
    "graz university of technology": "Graz University of Technology",
    "university of applied sciences graz": "University of Applied Sciences - Graz",
    "university of applied sciences amberg weiden": "University of Applied Sciences Amberg-Weiden",
    "helsinki polytechnic": "Helsinki Polytechnic",
    "hindustan university": "Hindustan University",
    "honda technical college kansai": "Honda Technical College Kansai",
    "hope college": "Hope College",
    "hoseo university": "Hoseo University",
    "howard community college": "Howard Community College",
    "hudson valley community college": "Hudson Valley Community College",
    "hunan university": "Hunan University",
    "illinois institute of technology": "Illinois Institute of Technology",
    "indian institute of technology bombay": "Indian Institute of Technology Bombay",
    "indian institute of technology delhi": "Indian Institute of Technology Delhi",
    "indiana university purdue university indianapolis": "IUPUI",
    iupui: "IUPUI",
    "instituto maua de tecnologia": "Instituto Mauá de Tecnologia",
    "instituto politecnico nacional": "Instituto Politécnico Nacional",
    "instituto tecnologico de chihuahua": "Instituto Tecnológico de Chihuahua",
    "interamerican university of puerto rico": "Inter American University of Puerto Rico",
    "iowa state university": "Iowa State University",
    "ipn esime up ticoman": "IPN - ESIME Ticoman",
    "ipn upiita": "IPN - UPIITA",
    "ipn esime zacatenco": "IPN - ESIME Zacatenco",
    "istanbul technical university": "Istanbul Technical University",
    "itesm campus cuernavaca": "ITESM - Campus Cuernavaca",
    "itesm campus qro": "ITESM - Campus Querétaro",
    "j s s academy of technical education": "JSS Academy of Technical Education",
    "kanagawa institute of technology": "Kanagawa Institute of Technology",
    "kanazawa university": "Kanazawa University",
    "kansas state university": "Kansas State University",
    "karlsruhe institute of technology": "Karlsruhe Institute of Technology",
    "kennesaw state university": "Kennesaw State University",
    "kettering university": "Kettering University",
    "khalifa university": "Khalifa University",
    "kokushikan university": "Kokushikan University",
    "kookmin university": "Kookmin University",
    "korea advanced institute of science and technology": "KAIST",
    "kumaraguru college of technology": "Kumaraguru College of Technology",
    "kumoh national institute of technology": "Kumoh National Institute of Technology",
    "la universidad del zulia": "La Universidad del Zulia",
    "lafayette college": "Lafayette College",
    "lakehead university": "Lakehead University",
    "lamar university": "Lamar University",
    "laval university": "Université Laval",
    "universite laval": "Université Laval",
    "lawrence tech university": "Lawrence Technological University",
    "lawrence technological university": "Lawrence Technological University",
    "leeds university": "University of Leeds",
    "university of leeds": "University of Leeds",
    "lehigh university": "Lehigh University",
    "letourneau university": "LeTourneau University",
    "liberty university": "Liberty University",
    "louisiana state university": "Louisiana State University",
    "lovely professional university": "Lovely Professional University",
    "loyola marymount college": "Loyola Marymount University",
    "loyola marymount university": "Loyola Marymount University",
    "m h saboo siddik college of engineering": "M. H. Saboo Siddik College of Engineering",
    "madi state technical university": "MADI State Technical University",
    "marquette university": "Marquette University",
    "massachusetts institute of technology": "Massachusetts Institute of Technology",
    "mcgill university": "McGill University",
    "mcmaster university": "McMaster University",
    "memorial university of newfoundland": "Memorial University of Newfoundland",
    "mercer university": "Mercer University",
    "metropolia university of applied science": "Metropolia University of Applied Sciences",
    "miami university": "Miami University",
    "michigan state university": "Michigan State University",
    "michigan tech university": "Michigan Technological University",
    "michigan technological university": "Michigan Technological University",
    "middle tennessee state university": "Middle Tennessee State University",
    "midwestern state university": "Midwestern State University",
    "milwaukee school of engineering": "Milwaukee School of Engineering",
    "minnesota state university": "Minnesota State University - Mankato",
    "minnesota state university mankato": "Minnesota State University - Mankato",
    "mississippi state university": "Mississippi State University",
    "missouri state university": "Missouri State University",
    "missouri university of science and technology": "Missouri University of Science and Technology",
    "monroe county community college": "Monroe County Community College",
    "montana state university bozeman": "Montana State University - Bozeman",
    "national institute of technology karnataka": "National Institute of Technology Karnataka",
    "national university of singapore": "National University of Singapore",
    "new jersey institute of technology": "New Jersey Institute of Technology",
    "new york university": "New York University",
    "nihon university": "Nihon University",
    "north carolina a&t state university": "North Carolina A&T State University",
    "north carolina state university": "North Carolina State University",
    "north carolina state university raleigh": "North Carolina State University",
    "north dakota state university": "North Dakota State University",
    "northeastern university": "Northeastern University",
    "northern arizona university": "Northern Arizona University",
    "northern illinois university": "Northern Illinois University",
    "northwestern university": "Northwestern University",
    "oakland university": "Oakland University",
    "ohio state university": "Ohio State University",
    "the ohio state university": "Ohio State University",
    "oklahoma state university": "Oklahoma State University",
    "old dominion university": "Old Dominion University",
    "olin college of engineering": "Olin College of Engineering",
    "oregon institute of technology": "Oregon Institute of Technology",
    "oregon state university": "Oregon State University",
    "oxford brookes university": "Oxford Brookes University",
    "p e s institute of technology": "PES Institute of Technology",
    "pakistan navy engineering college": "Pakistan Navy Engineering College",
    "parks college of st louis university": "Parks College of Saint Louis University",
    "pellissippi state community college": "Pellissippi State Community College",
    "penn state university": "Pennsylvania State University - University Park",
    "penn state university university park": "Pennsylvania State University - University Park",
    "pennsylvania state university": "Pennsylvania State University - University Park",
    "pennsylvania state university university park": "Pennsylvania State University - University Park",
    "penn state university harrisburg": "Pennsylvania State University - Harrisburg",
    "pittsburg state university": "Pittsburg State University",
    "polytechnic university brooklyn": "Polytechnic University of Brooklyn",
    "polytechnic university of brooklyn": "Polytechnic University of Brooklyn",
    "polytechnic university of puerto rico": "Polytechnic University of Puerto Rico",
    "portland state university": "Portland State University",
    "purdue university": "Purdue University - West Lafayette",
    "purdue university w lafayette": "Purdue University - West Lafayette",
    "purdue university west lafayette": "Purdue University - West Lafayette",
    "purdue university calumet": "Purdue University - Calumet",
    "purdue university indianapolis": "Purdue University - Indianapolis",
    "purdue university northwest": "Purdue University - Northwest",
    "queen's university": "Queen's University",
    "queens university": "Queen's University",
    "queen's university ontario canada": "Queen's University",
    "rayat institute of engineering information technology": "Rayat Institute of Engineering and Information Technology",
    "recinto university de mayaguez": "University of Puerto Rico - Mayaguez",
    "rensselaer polytechnic institute": "Rensselaer Polytechnic Institute",
    rmit: "RMIT University",
    "rmit university": "RMIT University",
    "rochester institute of technology": "Rochester Institute of Technology",
    "rochester institute of technology dubai": "Rochester Institute of Technology - Dubai",
    "rose hulman institute of technology": "Rose-Hulman Institute of Technology",
    "rutgers university": "Rutgers University",
    "rwth aachen technical university": "RWTH Aachen University",
    "rwth aachen technological university": "RWTH Aachen University",
    "ryerson university": "Toronto Metropolitan University",
    "ryerson polytechnic university": "Toronto Metropolitan University",
    "toronto metropolitan university": "Toronto Metropolitan University",
    "sacramento state university": "California State University - Sacramento",
    "saginaw valley state university": "Saginaw Valley State University",
    "saint louis university": "Saint Louis University",
    "san diego state university": "San Diego State University",
    "san jose state university": "San José State University",
    "santa clara university": "Santa Clara University",
    "seoul national university of science and technology": "Seoul National University of Science and Technology",
    "shanghai jiao tong university": "Shanghai Jiao Tong University",
    "sheridan college": "Sheridan College",
    "shibaura institute of technology": "Shibaura Institute of Technology",
    "sinhgad college of engineering": "Sinhgad College of Engineering",
    "sona college of technology": "Sona College of Technology",
    "sophia university": "Sophia University",
    "south dakota school of mines and technology": "South Dakota School of Mines and Technology",
    "south dakota state university": "South Dakota State University",
    "southern illinois university": "Southern Illinois University",
    "southern illinois university carbondale": "Southern Illinois University - Carbondale",
    "southern illinois university edwardsville": "Southern Illinois University - Edwardsville",
    "southern methodist university": "Southern Methodist University",
    "southern polytechnic state university": "Southern Polytechnic State University",
    "southern university a&m college": "Southern University and A&M College",
    "st cloud state university": "St. Cloud State University",
    "stanford university": "Stanford University",
    "stevens institute of technology": "Stevens Institute of Technology",
    "suny buffalo": "University at Buffalo",
    "university of buffalo": "University at Buffalo",
    "syracuse university": "Syracuse University",
    "tallinn university of technology": "Tallinn University of Technology",
    "technical university of munchen": "Technical University of Munich",
    "technical university of munich": "Technical University of Munich",
    "technische universitat berlin": "Technische Universität Berlin",
    "temple university": "Temple University",
    "tennessee tech university": "Tennessee Technological University",
    "tennessee technological university": "Tennessee Technological University",
    "texas a&m university": "Texas A&M University - College Station",
    "texas a&m university college station": "Texas A&M University - College Station",
    "texas a&m college station": "Texas A&M University - College Station",
    "texas a&m international university": "Texas A&M International University",
    "texas state university san marcos": "Texas State University - San Marcos",
    "texas tech university": "Texas Tech University",
    "thapar university": "Thapar University",
    "tokai university": "Tokai University",
    "tokyo denki university": "Tokyo Denki University",
    "trine university": "Trine University",
    "trinity university": "Trinity University",
    "turabo university": "Turabo University",
    "u a s graz": "University of Applied Sciences - Graz",
    "uas esslingen": "Esslingen University of Applied Sciences",
    "ulsan university": "University of Ulsan",
    "unexpo ccs": "UNEXPO - Caracas",
    "union college": "Union College",
    "unip universidade paulista": "Universidade Paulista",
    "united states air force academy": "United States Air Force Academy",
    "us air force academy": "United States Air Force Academy",
    "united states naval academy": "United States Naval Academy",
    "us naval academy": "United States Naval Academy",
    "vanderbilt university": "Vanderbilt University",
    "vaughn college of aeronautics": "Vaughn College of Aeronautics",
    "vel tech university": "Vel Tech University",
    "vellore institute of technology": "Vellore Institute of Technology",
    "villanova university": "Villanova University",
    "virginia commonwealth university": "Virginia Commonwealth University",
    "virginia institute of technology": "Virginia Tech",
    "virginia polytechnic institute and state university": "Virginia Tech",
    "virginia tech": "Virginia Tech",
    "warsaw university of technology": "Warsaw University of Technology",
    "washington state university": "Washington State University",
    "washington state university vancouver": "Washington State University - Vancouver",
    "washington university": "Washington University in St. Louis",
    "washington university st louis": "Washington University in St. Louis",
    "washington university st. louis": "Washington University in St. Louis",
    "wayne state university": "Wayne State University",
    "west virginia university": "West Virginia University",
    "western michigan university": "Western Michigan University",
    "western university": "Western University",
    "western washington state university": "Western Washington University",
    "western washington university": "Western Washington University",
    "wichita state university": "Wichita State University",
    "worcester polytechnic institute": "Worcester Polytechnic Institute",
    "wroclaw university of technology": "Wroclaw University of Technology",
    "xiamen university of technology": "Xiamen University of Technology",
    "yale university": "Yale University",
    "yeungnam college of science and technology": "Yeungnam College of Science and Technology",
    "yeungnam university": "Yeungnam University",
    "york college of pa": "York College of Pennsylvania",
    "york college of pennsylvania": "York College of Pennsylvania",
  };

  Object.assign(ALIASES, {
    "university of alabama birmingham": "University of Alabama - Birmingham",
    "university of alabama huntsville": "University of Alabama - Huntsville",
    "university of alabama tuscaloosa": "University of Alabama - Tuscaloosa",
    "university of california berkeley": "University of California - Berkeley",
    "university of california davis": "University of California - Davis",
    "university of california irvine": "University of California - Irvine",
    "university of california los angeles": "University of California - Los Angeles",
    "university of california merced": "University of California - Merced",
    "university of california riverside": "University of California - Riverside",
    "university of california san diego": "University of California - San Diego",
    "university of california santa barbara": "University of California - Santa Barbara",
    "university of california santa cruz": "University of California - Santa Cruz",
    "university of colorado boulder": "University of Colorado - Boulder",
    "university of colorado colorado springs": "University of Colorado - Colorado Springs",
    "university of colorado denver": "University of Colorado - Denver",
    "university of illinois chicago": "University of Illinois - Chicago",
    "university of illinois urbana champaign": "University of Illinois - Urbana-Champaign",
    "university of michigan ann arbor": "University of Michigan - Ann Arbor",
    "university of michigan dearborn": "University of Michigan - Dearborn",
    "university of minnesota": "University of Minnesota - Twin Cities",
    "university of minnesota twin cities": "University of Minnesota - Twin Cities",
    "university of minnesota minneapolis": "University of Minnesota - Twin Cities",
    "university of minnesota duluth": "University of Minnesota - Duluth",
    "university of missouri": "University of Missouri - Columbia",
    "university of missouri columbia": "University of Missouri - Columbia",
    "university of missouri rolla": "Missouri University of Science and Technology",
    "university of puerto rico": "University of Puerto Rico",
    "university of puerto rico mayaguez": "University of Puerto Rico - Mayaguez",
    "university of texas arlington": "University of Texas - Arlington",
    "university of texas austin": "University of Texas - Austin",
    "university of texas dallas": "University of Texas - Dallas",
    "university of texas el paso": "University of Texas - El Paso",
    "university of texas san antonio": "University of Texas - San Antonio",
    "university of wisconsin madison": "University of Wisconsin - Madison",
    "university of wisconsin platteville": "University of Wisconsin - Platteville",
    "university of akron": "University of Akron",
    "university of alberta": "University of Alberta",
    "university of arizona": "University of Arizona",
    "university of bath": "University of Bath",
    "university of birmingham": "University of Birmingham",
    "university of british columbia": "University of British Columbia",
    "university of british columbia okanagan": "University of British Columbia - Okanagan",
    "university of calgary": "University of Calgary",
    "university of central florida": "University of Central Florida",
    "university of cincinnati": "University of Cincinnati",
    "university of connecticut": "University of Connecticut",
    "university of delaware": "University of Delaware",
    "university of evansville": "University of Evansville",
    "university of florida": "University of Florida",
    "university of georgia": "University of Georgia",
    "university of guelph": "University of Guelph",
    "university of hartford": "University of Hartford",
    "university of hawaii manoa": "University of Hawaii - Manoa",
    "university of houston": "University of Houston",
    "university of houston houston": "University of Houston",
    "university of idaho": "University of Idaho",
    "university of iowa": "University of Iowa",
    "university of kansas": "University of Kansas - Lawrence",
    "university of kansas lawrence": "University of Kansas - Lawrence",
    "university of kentucky": "University of Kentucky",
    "university of louisiana lafayette": "University of Louisiana - Lafayette",
    "university of louisville": "University of Louisville",
    "university of maine": "University of Maine",
    "university of manitoba": "University of Manitoba",
    "university of maryland college park": "University of Maryland - College Park",
    "university of massachusetts dartmouth": "University of Massachusetts - Dartmouth",
    "university of massachusetts lowell": "University of Massachusetts - Lowell",
    "university of nebraska lincoln": "University of Nebraska - Lincoln",
    "university of nevada las vegas": "University of Nevada - Las Vegas",
    "university of nevada reno": "University of Nevada - Reno",
    "university of new brunswick": "University of New Brunswick",
    "university of new hampshire": "University of New Hampshire",
    "university of new mexico": "University of New Mexico",
    "university of north carolina asheville": "University of North Carolina - Asheville",
    "university of north carolina charlotte": "University of North Carolina - Charlotte",
    "university of north dakota": "University of North Dakota",
    "university of north florida": "University of North Florida",
    "university of north texas": "University of North Texas",
    "university of oklahoma": "University of Oklahoma",
    "university of ontario institute of technology": "Ontario Tech University",
    "university of ottawa": "University of Ottawa",
    "university of patras": "University of Patras",
    "university of pennsylvania": "University of Pennsylvania",
    "university of pittsburgh": "University of Pittsburgh",
    "university of pittsburgh pittsburgh": "University of Pittsburgh",
    "university of pune": "University of Pune",
    "university of regina": "University of Regina",
    "university of saskatchewan": "University of Saskatchewan",
    "university of south alabama": "University of South Alabama",
    "university of south florida": "University of South Florida",
    "university of southern california": "University of Southern California",
    "university of st thomas": "University of St. Thomas",
    "university of stuttgart": "University of Stuttgart",
    "universitat stuttgart": "University of Stuttgart",
    "university of technology petronas": "Universiti Teknologi PETRONAS",
    "university of the pacific": "University of the Pacific",
    "university of toledo": "University of Toledo",
    "university of toronto": "University of Toronto",
    "university of utah": "University of Utah",
    "university of victoria": "University of Victoria",
    "university of virginia": "University of Virginia",
    "university of washington": "University of Washington",
    "university of waterloo": "University of Waterloo",
    "university of western australia": "University of Western Australia",
    "university of western ontario": "Western University",
    "university of windsor": "University of Windsor",
    "university of wollongong": "University of Wollongong",
  });

  Object.assign(ALIASES, {
    "universidad autonoma de baja california": "Universidad Autónoma de Baja California",
    "universidad autonoma estado mexico": "Universidad Autónoma del Estado de México",
    "universidad catolica andres bello": "Universidad Católica Andrés Bello",
    "universidad central de venezuela": "Universidad Central de Venezuela",
    "universidad de oriente": "Universidad de Oriente",
    "universidad fermin toro": "Universidad Fermín Toro",
    "universidad iberoamericana": "Universidad Iberoamericana",
    "universidad metropolitana": "Universidad Metropolitana",
    "universidad nacional autonoma de mexico": "Universidad Nacional Autónoma de México",
    "universidad nacional experimental franci": "Universidad Nacional Experimental Francisco de Miranda",
    "universidad nacional experimental polite": "Universidad Nacional Experimental Politécnica",
    "universidad nacional experimental politecnica": "Universidad Nacional Experimental Politécnica",
    "universidad panamericana": "Universidad Panamericana",
    "universidad panamericana sede guadalajar": "Universidad Panamericana - Guadalajara",
    "universidad politecnica de chihuahua": "Universidad Politécnica de Chihuahua",
    "universidad politecnica de valencia": "Universitat Politècnica de València",
    "universidad simon bolivar": "Universidad Simón Bolívar",
    "universidade de sao paulo": "Universidade de São Paulo",
    "universidade estadual de campinas": "Universidade Estadual de Campinas",
    "universidade estadual paulista": "Universidade Estadual Paulista",
    "universidade federal de santa maria": "Universidade Federal de Santa Maria",
    "universidade federal do rio grande do su": "Universidade Federal do Rio Grande do Sul",
    "universit degli studi di brescia": "Università degli Studi di Brescia",
    "universita degli studi di firenze": "Università degli Studi di Firenze",
    "universite de sherbrooke": "Université de Sherbrooke",
    "universite du quebec chicoutimi": "Université du Québec à Chicoutimi",
    "universite du quebec a chicoutimi": "Université du Québec à Chicoutimi",
    "universite du quebec a trois rivieres": "Université du Québec à Trois-Rivières",
    "university of quebec trois rivieres": "Université du Québec à Trois-Rivières",
  });

  Object.assign(ALIASES, {
    "texas technology university": "Texas Tech University",
    "tennessee technology university": "Tennessee Technological University",
    "michigan technology university": "Michigan Technological University",
    "lawrence technology university": "Lawrence Technological University",
    "rwth aachen technology university": "RWTH Aachen University",
    "vel technology university": "Vel Tech University",
    "virginia technology": "Virginia Tech",
    "new jersey institute technology": "New Jersey Institute of Technology",
    "madi state technology university": "MADI State Technical University",
    "cal polytechnic san luis obispo": "California Polytechnic State University - San Luis Obispo",
    "embry riddle aeronautical u daytona beach": "Embry-Riddle Aeronautical University - Daytona Beach",
    "cooper union for advancement science and art": "Cooper Union",
    "city college of the city university of ny": "City College of New York",
    "florida a&m university florida state university": "FAMU-FSU College of Engineering",
    "texas a&m university college station": "Texas A&M University - College Station",
    "texas a&m college station": "Texas A&M University - College Station",
    "north carolina a&t state university": "North Carolina A&T State University",
    "southern university a&m college": "Southern University and A&M College",
    "alabama a&m university": "Alabama A&M University",
  });

  const JUNK_PATTERNS = [
    /^\s*$/,
    /^\d+(\.\d+)?$/,
    /^teams officially withdrew$/,
    /^teams who forfeit$/,
    /^score reduced\b/,
  ];

  const STATUS_PATTERNS = [
    { regex: /\s*-\s*officially withdrew onsite\s*\/\s*no car\s*$/i, status: "Officially Withdrew / No Car" },
    { regex: /\s*-\s*officially withdrew.*$/i, status: "Officially Withdrew" },
    { regex: /\s*-\s*forfeit\s*$/i, status: "Forfeit" },
    { regex: /\s*-\s*dropped\s*$/i, status: "Dropped" },
  ];

  function normalizeSpacing(s) {
    return String(s).replace(/\s+/g, " ").trim();
  }

  function normalizeForKey(s) {
    return normalizeSpacing(
      String(s ?? "")
        .normalize("NFKD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[’`´]/g, "'")
        .replace(/[–—−]/g, "-")
        .replace(/\\/g, " ")
        .replace(/\s*\/\s*/g, " / ")
        .replace(/\s*-\s*/g, " - ")
        .replace(/\s*,\s*/g, ", ")
        .replace(/[()]/g, " ")
        .replace(/[.;:]/g, " ")
    );
  }

  function applySpellingFixes(key) {
    for (const [wrong, right] of Object.entries(SPELLING_FIXES)) {
      key = key.replace(new RegExp(`\\b${escapeRegex(wrong)}\\b`, "g"), right);
    }
    return normalizeSpacing(key);
  }

  function normalizeAmpersands(key) {
    return normalizeSpacing(
      key
        .replace(/\ba\s*&\s*m\b/g, "a__m")
        .replace(/\ba\s+and\s+m\b/g, "a__m")
        .replace(/\ba\s*&\s*t\b/g, "a__t")
        .replace(/\ba\s+and\s+t\b/g, "a__t")
        .replace(/\s*&\s*/g, " and ")
        .replace(/\ba__m\b/g, "a&m")
        .replace(/\ba__t\b/g, "a&t")
    );
  }

  function expandAbbreviations(key) {
    for (const [pattern, replacement] of ABBREVIATION_REPLACEMENTS) key = key.replace(pattern, replacement);
    return normalizeSpacing(key);
  }

  function normalizeCampusSeparators(key) {
    return normalizeSpacing(key.replace(/,/g, " ").replace(/ - /g, " ").replace(/-/g, " ").replace(/ \/ /g, " "));
  }

  function removeNoiseWords(key) {
    return normalizeSpacing(
      key
        .replace(/\bontario canada\b$/, "")
        .replace(/\bcanada\b$/, "")
        .replace(/^the ohio state university$/, "ohio state university")
    );
  }

  function normalizedKey(s) {
    let key = normalizeForKey(s);
    key = applySpellingFixes(key);
    key = normalizeAmpersands(key);
    key = expandAbbreviations(key);
    key = normalizeCampusSeparators(key);
    key = removeNoiseWords(key);
    return normalizeSpacing(key);
  }

  function extractCarNumber(s) {
    const match = String(s).match(/^\s*car\s*#\s*(\d+)\s*(.*)$/i);
    return match ? [Number(match[1]), match[2].trim()] : [null, s];
  }

  function extractStatusSuffix(s) {
    for (const { regex, status } of STATUS_PATTERNS) {
      if (regex.test(s)) return [status, s.replace(regex, "").trim()];
    }
    return [null, s];
  }

  function matchesAny(s, patterns) {
    return patterns.some((pattern) => pattern.test(s));
  }

  function tryGenerateKnownUniversitySystem(remainder) {
    const systems = {
      california: "University of California",
      colorado: "University of Colorado",
      illinois: "University of Illinois",
      michigan: "University of Michigan",
      minnesota: "University of Minnesota",
      missouri: "University of Missouri",
      texas: "University of Texas",
      wisconsin: "University of Wisconsin",
      alabama: "University of Alabama",
    };
    const [system, ...campusParts] = remainder.split(" ");
    if (!systems[system]) return null;
    const campus = normalizeKnownCampus(campusParts.join(" "));
    if (!campus) return null;
    if (system === "missouri" && campus === "Rolla") return "Missouri University of Science and Technology";
    return `${systems[system]} - ${campus}`;
  }

  function normalizeKnownCampus(campusKey) {
    campusKey = normalizeSpacing(campusKey);
    if (CAMPUS_ALIASES[campusKey]) return CAMPUS_ALIASES[campusKey];
    if (campusKey.length < 3) return null;
    return smartTitleCaseSchoolName(campusKey);
  }

  function tryGenerateUniversityCampusName(key) {
    if (key.startsWith("university of ")) {
      const remainder = key.slice("university of ".length);
      return tryGenerateKnownUniversitySystem(remainder) || `University of ${smartTitleCaseSchoolName(remainder)}`;
    }
    if (key.endsWith(" university")) return smartTitleCaseSchoolName(key);
    if (key.endsWith(" institute of technology")) return smartTitleCaseSchoolName(key);
    if (key.endsWith(" college")) return smartTitleCaseSchoolName(key);
    return null;
  }

  function smartTitleCaseSchoolName(key) {
    const smallWords = new Set(["of", "and", "the", "de", "del", "da", "do", "du", "a", "in", "for", "at", "to"]);
    const forceUpper = {
      "a&m": "A&M",
      "a&t": "A&T",
      agh: "AGH",
      bits: "BITS",
      cefet: "CEFET",
      fei: "FEI",
      fh: "FH",
      famu: "FAMU",
      fsu: "FSU",
      ipn: "IPN",
      itesm: "ITESM",
      iupui: "IUPUI",
      kaist: "KAIST",
      mit: "MIT",
      rmit: "RMIT",
      rwth: "RWTH",
      suny: "SUNY",
      uas: "UAS",
      unexpo: "UNEXPO",
      unip: "UNIP",
      usp: "USP",
    };
    return key
      .split(" ")
      .filter(Boolean)
      .map((word, index) => {
        if (forceUpper[word]) return forceUpper[word];
        if (index > 0 && smallWords.has(word)) return word;
        return word
          .split("-")
          .map((part) => forceUpper[part] || (smallWords.has(part) ? part : part.charAt(0).toUpperCase() + part.slice(1)))
          .join("-");
      })
      .join(" ")
      .replace(/\bSt /g, "St. ")
      .replace(/A&m/g, "A&M")
      .replace(/A&t/g, "A&T");
  }

  function canonicalizeSchoolName(rawName) {
    const result = {
      raw_school_name: rawName,
      canonical_school: null,
      school_status: null,
      car_number: null,
      normalized_key: null,
      match_method: null,
      needs_review: false,
      review_reason: null,
    };

    if (rawName === null || rawName === undefined) {
      result.school_status = "Junk";
      result.needs_review = true;
      result.review_reason = "Null school name";
      return result;
    }

    let s = String(rawName).trim();
    const junkKey = normalizeForKey(s);
    if (matchesAny(junkKey, JUNK_PATTERNS)) {
      result.school_status = "Junk";
      result.match_method = "junk_pattern";
      return result;
    }

    [result.car_number, s] = extractCarNumber(s);
    const statusResult = extractStatusSuffix(s);
    result.school_status = statusResult[0];
    s = statusResult[1];

    const key = normalizedKey(s);
    result.normalized_key = key;
    if (matchesAny(key, JUNK_PATTERNS)) {
      result.school_status = "Junk";
      result.match_method = "junk_after_normalization";
      return result;
    }

    if (ALIASES[key]) {
      result.canonical_school = ALIASES[key];
      result.match_method = "exact_alias";
      return result;
    }

    const generated = tryGenerateUniversityCampusName(key);
    if (generated !== null) {
      const generatedKey = normalizeForKey(generated);
      result.canonical_school = ALIASES[generatedKey] || generated;
      result.match_method = ALIASES[generatedKey] ? "generated_then_alias" : "generated_campus_name";
      result.needs_review = !ALIASES[generatedKey];
      result.review_reason = result.needs_review ? "Generated canonical name not found in alias table" : null;
      return result;
    }

    result.canonical_school = smartTitleCaseSchoolName(key);
    result.match_method = "titlecase_fallback";
    result.needs_review = true;
    result.review_reason = "No exact alias found";
    return result;
  }

  function tokenSetSimilarity(a, b) {
    const aa = new Set(normalizedKey(a).split(" ").filter(Boolean));
    const bb = new Set(normalizedKey(b).split(" ").filter(Boolean));
    const inter = [...aa].filter((x) => bb.has(x)).length;
    const denom = aa.size + bb.size;
    return denom ? Math.round((200 * inter) / denom) : 0;
  }

  function extractKnownCampusFromKey(key) {
    for (const [campusKey, canonicalCampus] of Object.entries(CAMPUS_ALIASES)) {
      if (new RegExp(`\\b${escapeRegex(campusKey)}\\b`).test(key)) return canonicalCampus;
    }
    return null;
  }

  function campusesConflict(keyA, keyB) {
    const campusA = extractKnownCampusFromKey(keyA);
    const campusB = extractKnownCampusFromKey(keyB);
    return campusA !== null && campusB !== null && campusA !== campusB;
  }

  function fuzzyReviewUnmatchedResults(results) {
    const names = [...new Set(results.map((r) => r.canonical_school).filter(Boolean))];
    const suggestions = [];
    for (let i = 0; i < names.length; i++) {
      for (let j = i + 1; j < names.length; j++) {
        const keyA = normalizeForKey(names[i]);
        const keyB = normalizeForKey(names[j]);
        if (campusesConflict(keyA, keyB)) continue;
        const score = tokenSetSimilarity(keyA, keyB);
        if (score >= 97) suggestions.push({ name_a: names[i], name_b: names[j], score, recommendation: "auto_merge_candidate" });
        else if (score >= 90) suggestions.push({ name_a: names[i], name_b: names[j], score, recommendation: "manual_review" });
      }
    }
    return suggestions;
  }

  function processSchoolNames(rawSchoolNames) {
    const cleaned_rows = rawSchoolNames.map(canonicalizeSchoolName);
    return { cleaned_rows, fuzzy_suggestions: fuzzyReviewUnmatchedResults(cleaned_rows) };
  }

  function escapeRegex(s) {
    return String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  window.FSAESchoolCanonicalization = {
    canonicalizeSchoolName,
    processSchoolNames,
    fuzzyReviewUnmatchedResults,
    normalizeForKey,
    normalizedKey,
    ALIASES,
    CAMPUS_ALIASES,
  };
  window.canonicalizeSchoolName = canonicalizeSchoolName;
  window.cleanTeamName = (s) => canonicalizeSchoolName(s).canonical_school || "";
})();
