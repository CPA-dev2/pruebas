// frontend/src/utils/variables.js

/**
 * Catálogo completo de Departamentos de Guatemala.
 */
export const DEPARTAMENTOS = [
    { value: 'alta_verapaz', label: 'Alta Verapaz' },
    { value: 'baja_verapaz', label: 'Baja Verapaz' },
    { value: 'chimaltenango', label: 'Chimaltenango' },
    { value: 'chiquimula', label: 'Chiquimula' },
    { value: 'el_progreso', label: 'El Progreso' },
    { value: 'escuintla', label: 'Escuintla' },
    { value: 'guatemala', label: 'Guatemala' },
    { value: 'huehuetenango', label: 'Huehuetenango' },
    { value: 'izabal', label: 'Izabal' },
    { value: 'jalapa', label: 'Jalapa' },
    { value: 'jutiapa', label: 'Jutiapa' },
    { value: 'peten', label: 'Petén' },
    { value: 'quetzaltenango', label: 'Quetzaltenango' },
    { value: 'quiche', label: 'Quiché' },
    { value: 'retalhuleu', label: 'Retalhuleu' },
    { value: 'sacatepequez', label: 'Sacatepéquez' },
    { value: 'san_marcos', label: 'San Marcos' },
    { value: 'santa_rosa', label: 'Santa Rosa' },
    { value: 'solola', label: 'Sololá' },
    { value: 'suchitepequez', label: 'Suchitepéquez' },
    { value: 'totonicapan', label: 'Totonicapán' },
    { value: 'zacapa', label: 'Zacapa' }
];

/**
 * Catálogo completo de Municipios por Departamento.
 */
export const MUNICIPIOS = {
    'alta_verapaz': [
        { value: 'coban', label: 'Cobán' },
        { value: 'santa_cruz_verapaz', label: 'Santa Cruz Verapaz' },
        { value: 'san_cristobal_verapaz', label: 'San Cristóbal Verapaz' },
        { value: 'tactic', label: 'Tactic' },
        { value: 'tamahu', label: 'Tamahú' },
        { value: 'tucuru', label: 'Tucurú' },
        { value: 'panzos', label: 'Panzós' },
        { value: 'senahu', label: 'Senahú' },
        { value: 'san_pedro_carcha', label: 'San Pedro Carchá' },
        { value: 'san_juan_chamelco', label: 'San Juan Chamelco' },
        { value: 'lanquin', label: 'Lanquín' },
        { value: 'cahabon', label: 'Cahabón' },
        { value: 'chisec', label: 'Chisec' },
        { value: 'chahal', label: 'Chahal' },
        { value: 'fray_bartolome_de_las_casas', label: 'Fray Bartolomé de las Casas' },
        { value: 'santa_catalina_la_tinta', label: 'Santa Catalina La Tinta' },
        { value: 'raxruha', label: 'Raxruhá' }
    ],
    'baja_verapaz': [
        { value: 'salama', label: 'Salamá' },
        { value: 'san_miguel_chicaj', label: 'San Miguel Chicaj' },
        { value: 'rabinal', label: 'Rabinal' },
        { value: 'cubulco', label: 'Cubulco' },
        { value: 'granados', label: 'Granados' },
        { value: 'el_chol', label: 'El Chol' },
        { value: 'san_jeronimo', label: 'San Jerónimo' },
        { value: 'purulha', label: 'Purulhá' }
    ],
    'chimaltenango': [
        { value: 'chimaltenango', label: 'Chimaltenango' },
        { value: 'san_jose_poaquil', label: 'San José Poaquil' },
        { value: 'san_martin_jilotepeque', label: 'San Martín Jilotepeque' },
        { value: 'comalapa', label: 'Comalapa' },
        { value: 'santa_apolonia', label: 'Santa Apolonia' },
        { value: 'tecpan_guatemala', label: 'Tecpán Guatemala' },
        { value: 'patzun', label: 'Patzún' },
        { value: 'pochuta', label: 'Pochuta' },
        { value: 'patzicia', label: 'Patzicía' },
        { value: 'santa_cruz_balanya', label: 'Santa Cruz Balanyá' },
        { value: 'acatenango', label: 'Acatenango' },
        { value: 'yepocapa', label: 'Yepocapa' },
        { value: 'san_andres_itzapa', label: 'San Andrés Itzapa' },
        { value: 'parramos', label: 'Parramos' },
        { value: 'zaragoza', label: 'Zaragoza' },
        { value: 'el_tejar', label: 'El Tejar' }
    ],
    'chiquimula': [
        { value: 'chiquimula', label: 'Chiquimula' },
        { value: 'san_jose_la_arada', label: 'San José La Arada' },
        { value: 'san_juan_ermita', label: 'San Juan Ermita' },
        { value: 'jocotan', label: 'Jocotán' },
        { value: 'camotan', label: 'Camotán' },
        { value: 'olopa', label: 'Olopa' },
        { value: 'esquipulas', label: 'Esquipulas' },
        { value: 'concepcion_las_minas', label: 'Concepción Las Minas' },
        { value: 'quezaltepeque', label: 'Quezaltepeque' },
        { value: 'san_jacinto', label: 'San Jacinto' },
        { value: 'ipala', label: 'Ipala' }
    ],
    'el_progreso': [
        { value: 'guastatoya', label: 'Guastatoya' },
        { value: 'morazan', label: 'Morazán' },
        { value: 'san_agustin_acasaguastlan', label: 'San Agustín Acasaguastlán' },
        { value: 'san_cristobal_acasaguastlan', label: 'San Cristóbal Acasaguastlán' },
        { value: 'el_jicaro', label: 'El Jícaro' },
        { value: 'sansare', label: 'Sansare' },
        { value: 'sanarate', label: 'Sanarate' },
        { value: 'san_antonio_la_paz', label: 'San Antonio La Paz' }
    ],
    'escuintla': [
        { value: 'escuintla', label: 'Escuintla' },
        { value: 'santa_lucia_cotzumalguapa', label: 'Santa Lucía Cotzumalguapa' },
        { value: 'la_democracia', label: 'La Democracia' },
        { value: 'siquinala', label: 'Siquinalá' },
        { value: 'masagua', label: 'Masagua' },
        { value: 'tiquisate', label: 'Tiquisate' },
        { value: 'la_gomera', label: 'La Gomera' },
        { value: 'guanagazapa', label: 'Guanagazapa' },
        { value: 'san_jose', label: 'San José' },
        { value: 'iztapa', label: 'Iztapa' },
        { value: 'palin', label: 'Palín' },
        { value: 'san_vicente_pacaya', label: 'San Vicente Pacaya' },
        { value: 'nueva_concepcion', label: 'Nueva Concepción' },
        { value: 'sipacate', label: 'Sipacate' }
    ],
    'guatemala': [
        { value: 'guatemala', label: 'Ciudad de Guatemala' },
        { value: 'santa_catarina_pinula', label: 'Santa Catarina Pinula' },
        { value: 'san_jose_pinula', label: 'San José Pinula' },
        { value: 'san_jose_del_golfo', label: 'San José del Golfo' },
        { value: 'palencia', label: 'Palencia' },
        { value: 'chinautla', label: 'Chinautla' },
        { value: 'san_pedro_ayampuc', label: 'San Pedro Ayampuc' },
        { value: 'mixco', label: 'Mixco' },
        { value: 'san_pedro_sacatepequez', label: 'San Pedro Sacatepéquez' },
        { value: 'san_juan_sacatepequez', label: 'San Juan Sacatepéquez' },
        { value: 'san_raymundo', label: 'San Raymundo' },
        { value: 'chuarrancho', label: 'Chuarrancho' },
        { value: 'fraijanes', label: 'Fraijanes' },
        { value: 'amatitlan', label: 'Amatitlán' },
        { value: 'villa_nueva', label: 'Villa Nueva' },
        { value: 'villa_canales', label: 'Villa Canales' },
        { value: 'petapa', label: 'Petapa' }
    ],
    'huehuetenango': [
        { value: 'huehuetenango', label: 'Huehuetenango' },
        { value: 'chiantla', label: 'Chiantla' },
        { value: 'malacatancito', label: 'Malacatancito' },
        { value: 'cuilco', label: 'Cuilco' },
        { value: 'nenton', label: 'Nentón' },
        { value: 'san_pedro_necta', label: 'San Pedro Necta' },
        { value: 'jacaltenango', label: 'Jacaltenango' },
        { value: 'soloma', label: 'Soloma' },
        { value: 'ixtahuacan', label: 'Ixtahuacán' },
        { value: 'santa_barbara', label: 'Santa Bárbara' },
        { value: 'la_libertad', label: 'La Libertad' },
        { value: 'la_democracia', label: 'La Democracia' },
        { value: 'san_miguel_acatan', label: 'San Miguel Acatán' },
        { value: 'san_rafael_la_independencia', label: 'San Rafael La Independencia' },
        { value: 'todos_santos_cuchumatan', label: 'Todos Santos Cuchumatán' },
        { value: 'san_juan_atitan', label: 'San Juan Atitán' },
        { value: 'santa_eulalia', label: 'Santa Eulalia' },
        { value: 'san_mateo_ixtatan', label: 'San Mateo Ixtatán' },
        { value: 'colotenango', label: 'Colotenango' },
        { value: 'san_sebastian_huehuetenango', label: 'San Sebastián Huehuetenango' },
        { value: 'tectitan', label: 'Tectitán' },
        { value: 'concepcion_huista', label: 'Concepción Huista' },
        { value: 'san_juan_ixcoy', label: 'San Juan Ixcoy' },
        { value: 'san_antonio_huista', label: 'San Antonio Huista' },
        { value: 'san_sebastian_coatan', label: 'San Sebastián Coatán' },
        { value: 'barillas', label: 'Barillas' },
        { value: 'aguacatan', label: 'Aguacatán' },
        { value: 'san_rafael_petzal', label: 'San Rafael Petzal' },
        { value: 'san_gaspar_ixchil', label: 'San Gaspar Ixchil' },
        { value: 'santiago_chimaltenango', label: 'Santiago Chimaltenango' },
        { value: 'santa_ana_huista', label: 'Santa Ana Huista' },
        { value: 'union_cantinil', label: 'Unión Cantinil' },
        { value: 'petatan', label: 'Petatán' }
    ],
    'izabal': [
        { value: 'puerto_barrios', label: 'Puerto Barrios' },
        { value: 'livingston', label: 'Livingston' },
        { value: 'el_estor', label: 'El Estor' },
        { value: 'morales', label: 'Morales' },
        { value: 'los_amates', label: 'Los Amates' }
    ],
    'jalapa': [
        { value: 'jalapa', label: 'Jalapa' },
        { value: 'san_pedro_pinula', label: 'San Pedro Pinula' },
        { value: 'san_luis_jilotepeque', label: 'San Luis Jilotepeque' },
        { value: 'san_manuel_chaparron', label: 'San Manuel Chaparrón' },
        { value: 'san_carlos_alzatate', label: 'San Carlos Alzatate' },
        { value: 'monjas', label: 'Monjas' },
        { value: 'mataquescuintla', label: 'Mataquescuintla' }
    ],
    'jutiapa': [
        { value: 'jutiapa', label: 'Jutiapa' },
        { value: 'el_progreso', label: 'El Progreso' },
        { value: 'santa_catarina_mita', label: 'Santa Catarina Mita' },
        { value: 'agua_blanca', label: 'Agua Blanca' },
        { value: 'asuncion_mita', label: 'Asunción Mita' },
        { value: 'yupiltepeque', label: 'Yupiltepeque' },
        { value: 'atescatempa', label: 'Atescatempa' },
        { value: 'jerez', label: 'Jerez' },
        { value: 'el_adelanto', label: 'El Adelanto' },
        { value: 'zapotitlan', label: 'Zapotitlán' },
        { value: 'comapa', label: 'Comapa' },
        { value: 'jalpatagua', label: 'Jalpatagua' },
        { value: 'conguaco', label: 'Conguaco' },
        { value: 'moyuta', label: 'Moyuta' },
        { value: 'pasaco', label: 'Pasaco' },
        { value: 'san_jose_acatempa', label: 'San José Acatempa' },
        { value: 'quesada', label: 'Quesada' }
    ],
    'peten': [
        { value: 'flores', label: 'Flores' },
        { value: 'san_jose', label: 'San José' },
        { value: 'san_benito', label: 'San Benito' },
        { value: 'san_andres', label: 'San Andrés' },
        { value: 'la_libertad', label: 'La Libertad' },
        { value: 'san_francisco', label: 'San Francisco' },
        { value: 'santa_ana', label: 'Santa Ana' },
        { value: 'dolores', label: 'Dolores' },
        { value: 'san_luis', label: 'San Luis' },
        { value: 'sayaxche', label: 'Sayaxché' },
        { value: 'melchor_de_mencos', label: 'Melchor de Mencos' },
        { value: 'poptun', label: 'Poptún' },
        { value: 'las_cruces', label: 'Las Cruces' },
        { value: 'el_chal', label: 'El Chal' }
    ],
    'quetzaltenango': [
        { value: 'quetzaltenango', label: 'Quetzaltenango' },
        { value: 'salcaja', label: 'Salcajá' },
        { value: 'olintepeque', label: 'Olintepeque' },
        { value: 'san_carlos_sija', label: 'San Carlos Sija' },
        { value: 'sibilia', label: 'Sibilia' },
        { value: 'cabrican', label: 'Cabricán' },
        { value: 'cajola', label: 'Cajolá' },
        { value: 'san_miguel_siguila', label: 'San Miguel Sigüilá' },
        { value: 'ostuncalco', label: 'Ostuncalco' },
        { value: 'san_mateo', label: 'San Mateo' },
        { value: 'concepcion_chiquirichapa', label: 'Concepción Chiquirichapa' },
        { value: 'san_martin_sacatepequez', label: 'San Martín Sacatepéquez' },
        { value: 'almolonga', label: 'Almolonga' },
        { value: 'cantel', label: 'Cantel' },
        { value: 'huitan', label: 'Huitán' },
        { value: 'zunil', label: 'Zunil' },
        { value: 'colomba', label: 'Colomba' },
        { value: 'san_francisco_la_union', label: 'San Francisco La Unión' },
        { value: 'el_palmar', label: 'El Palmar' },
        { value: 'coatepeque', label: 'Coatepeque' },
        { value: 'genova', label: 'Génova' },
        { value: 'flores_costa_cuca', label: 'Flores Costa Cuca' },
        { value: 'la_esperanza', label: 'La Esperanza' },
        { value: 'palestina_de_los_altos', label: 'Palestina de Los Altos' }
    ],
    'quiche': [
        { value: 'santa_cruz_del_quiche', label: 'Santa Cruz del Quiché' },
        { value: 'chiche', label: 'Chiché' },
        { value: 'chinique', label: 'Chinique' },
        { value: 'zacualpa', label: 'Zacualpa' },
        { value: 'chajul', label: 'Chajul' },
        { value: 'chichicastenango', label: 'Chichicastenango' },
        { value: 'patzite', label: 'Patzité' },
        { value: 'san_antonio_ilotenango', label: 'San Antonio Ilotenango' },
        { value: 'san_pedro_jocopilas', label: 'San Pedro Jocopilas' },
        { value: 'cunen', label: 'Cunén' },
        { value: 'san_juan_cotzal', label: 'San Juan Cotzal' },
        { value: 'joyabaj', label: 'Joyabaj' },
        { value: 'nebaj', label: 'Nebaj' },
        { value: 'san_andres_sajcabaja', label: 'San Andrés Sajcabajá' },
        { value: 'uspantan', label: 'Uspantán' },
        { value: 'sacapulas', label: 'Sacapulas' },
        { value: 'san_bartolome_jocotenango', label: 'San Bartolomé Jocotenango' },
        { value: 'canilla', label: 'Canillá' },
        { value: 'chicaman', label: 'Chicamán' },
        { value: 'ixcan', label: 'Ixcán' },
        { value: 'pachalum', label: 'Pachalum' }
    ],
    'retalhuleu': [
        { value: 'retalhuleu', label: 'Retalhuleu' },
        { value: 'san_sebastian', label: 'San Sebastián' },
        { value: 'santa_cruz_mulua', label: 'Santa Cruz Muluá' },
        { value: 'san_martin_zapotitlan', label: 'San Martín Zapotitlán' },
        { value: 'san_felipe', label: 'San Felipe' },
        { value: 'san_andres_villa_seca', label: 'San Andrés Villa Seca' },
        { value: 'champerico', label: 'Champerico' },
        { value: 'nuevo_san_carlos', label: 'Nuevo San Carlos' },
        { value: 'el_asintal', label: 'El Asintal' }
    ],
    'sacatepequez': [
        { value: 'antigua_guatemala', label: 'Antigua Guatemala' },
        { value: 'jocotenango', label: 'Jocotenango' },
        { value: 'pastores', label: 'Pastores' },
        { value: 'sumpango', label: 'Sumpango' },
        { value: 'santo_domingo_xenacoj', label: 'Santo Domingo Xenacoj' },
        { value: 'santiago_sacatepequez', label: 'Santiago Sacatepéquez' },
        { value: 'san_bartolome_milpas_altas', label: 'San Bartolomé Milpas Altas' },
        { value: 'san_lucas_sacatepequez', label: 'San Lucas Sacatepéquez' },
        { value: 'santa_lucia_milpas_altas', label: 'Santa Lucía Milpas Altas' },
        { value: 'magdalena_milpas_altas', label: 'Magdalena Milpas Altas' },
        { value: 'santa_maria_de_jesus', label: 'Santa María de Jesús' },
        { value: 'ciudad_vieja', label: 'Ciudad Vieja' },
        { value: 'san_miguel_duenas', label: 'San Miguel Dueñas' },
        { value: 'alotenango', label: 'Alotenango' },
        { value: 'san_antonio_aguas_calientes', label: 'San Antonio Aguas Calientes' },
        { value: 'santa_catarina_barahona', label: 'Santa Catarina Barahona' }
    ],
    'san_marcos': [
        { value: 'san_marcos', label: 'San Marcos' },
        { value: 'san_pedro_sacatepequez', label: 'San Pedro Sacatepéquez' },
        { value: 'san_antonio_sacatepequez', label: 'San Antonio Sacatepéquez' },
        { value: 'comitancillo', label: 'Comitancillo' },
        { value: 'san_miguel_ixtahuacan', label: 'San Miguel Ixtahuacán' },
        { value: 'concepcion_tutuapa', label: 'Concepción Tutuapa' },
        { value: 'tacana', label: 'Tacaná' },
        { value: 'sibinal', label: 'Sibinal' },
        { value: 'tajumulco', label: 'Tajumulco' },
        { value: 'tejutla', label: 'Tejutla' },
        { value: 'san_rafael_pie_de_la_cuesta', label: 'San Rafael Pie de la Cuesta' },
        { value: 'nuevo_progreso', label: 'Nuevo Progreso' },
        { value: 'el_tumbador', label: 'El Tumbador' },
        { value: 'el_rodeo', label: 'El Rodeo' },
        { value: 'malacatan', label: 'Malacatán' },
        { value: 'catarina', label: 'Catarina' },
        { value: 'ayutla', label: 'Ayutla' },
        { value: 'ocos', label: 'Ocós' },
        { value: 'san_pablo', label: 'San Pablo' },
        { value: 'el_quetzal', label: 'El Quetzal' },
        { value: 'la_reforma', label: 'La Reforma' },
        { value: 'pajapita', label: 'Pajapita' },
        { value: 'ixchiguan', label: 'Ixchiguán' },
        { value: 'san_jose_ojetenam', label: 'San José Ojetenam' },
        { value: 'san_cristobal_cucho', label: 'San Cristóbal Cucho' },
        { value: 'sipacapa', label: 'Sipacapa' },
        { value: 'esquipulas_palo_gordo', label: 'Esquipulas Palo Gordo' },
        { value: 'rio_blanco', label: 'Río Blanco' },
        { value: 'san_lorenzo', label: 'San Lorenzo' },
        { value: 'la_blanca', label: 'La Blanca' }
    ],
    'santa_rosa': [
        { value: 'cuilapa', label: 'Cuilapa' },
        { value: 'barberena', label: 'Barberena' },
        { value: 'santa_rosa_de_lima', label: 'Santa Rosa de Lima' },
        { value: 'casillas', label: 'Casillas' },
        { value: 'san_rafael_las_flores', label: 'San Rafael Las Flores' },
        { value: 'oratorio', label: 'Oratorio' },
        { value: 'san_juan_tecuaco', label: 'San Juan Tecuaco' },
        { value: 'chiquimulilla', label: 'Chiquimulilla' },
        { value: 'taxisco', label: 'Taxisco' },
        { value: 'santa_maria_ixhuatan', label: 'Santa María Ixhuatán' },
        { value: 'guazacapan', label: 'Guazacapán' },
        { value: 'santa_cruz_naranjo', label: 'Santa Cruz Naranjo' },
        { value: 'pueblo_nuevo_vinas', label: 'Pueblo Nuevo Viñas' },
        { value: 'nueva_santa_rosa', label: 'Nueva Santa Rosa' }
    ],
    'solola': [
        { value: 'solola', label: 'Sololá' },
        { value: 'san_jose_chacaya', label: 'San José Chacayá' },
        { value: 'santa_maria_visitacion', label: 'Santa María Visitación' },
        { value: 'santa_lucia_utatlan', label: 'Santa Lucía Utatlán' },
        { value: 'nahuala', label: 'Nahualá' },
        { value: 'santa_catarina_ixtahuacan', label: 'Santa Catarina Ixtahuacán' },
        { value: 'santa_clara_la_laguna', label: 'Santa Clara La Laguna' },
        { value: 'concepcion', label: 'Concepción' },
        { value: 'san_andres_semetabaj', label: 'San Andrés Semetabaj' },
        { value: 'panajachel', label: 'Panajachel' },
        { value: 'santa_catarina_palopo', label: 'Santa Catarina Palopó' },
        { value: 'san_antonio_palopo', label: 'San Antonio Palopó' },
        { value: 'san_lucas_toliman', label: 'San Lucas Tolimán' },
        { value: 'santa_cruz_la_laguna', label: 'Santa Cruz La Laguna' },
        { value: 'san_pablo_la_laguna', label: 'San Pablo La Laguna' },
        { value: 'san_marcos_la_laguna', label: 'San Marcos La Laguna' },
        { value: 'san_juan_la_laguna', label: 'San Juan La Laguna' },
        { value: 'san_pedro_la_laguna', label: 'San Pedro La Laguna' },
        { value: 'santiago_atitlan', label: 'Santiago Atitlán' }
    ],
    'suchitepequez': [
        { value: 'mazatenango', label: 'Mazatenango' },
        { value: 'cuyotenango', label: 'Cuyotenango' },
        { value: 'san_francisco_zapotitlan', label: 'San Francisco Zapotitlán' },
        { value: 'san_bernardino', label: 'San Bernardino' },
        { value: 'san_jose_el_idolo', label: 'San José El Idolo' },
        { value: 'santo_domingo_suchitepequez', label: 'Santo Domingo Suchitepéquez' },
        { value: 'san_lorenzo', label: 'San Lorenzo' },
        { value: 'samayac', label: 'Samayac' },
        { value: 'san_pablo_jocopilas', label: 'San Pablo Jocopilas' },
        { value: 'san_antonio_suchitepequez', label: 'San Antonio Suchitepéquez' },
        { value: 'san_miguel_panan', label: 'San Miguel Panán' },
        { value: 'san_gabriel', label: 'San Gabriel' },
        { value: 'chicacao', label: 'Chicacao' },
        { value: 'patulul', label: 'Patulul' },
        { value: 'santa_barbara', label: 'Santa Bárbara' },
        { value: 'san_juan_bautista', label: 'San Juan Bautista' },
        { value: 'santo_tomas_la_union', label: 'Santo Tomás La Unión' },
        { value: 'zunilito', label: 'Zunilito' },
        { value: 'pueblo_nuevo', label: 'Pueblo Nuevo' },
        { value: 'rio_bravo', label: 'Río Bravo' },
        { value: 'san_jose_la_maquina', label: 'San José La Máquina' }
    ],
    'totonicapan': [
        { value: 'totonicapan', label: 'Totonicapán' },
        { value: 'san_cristobal_totonicapan', label: 'San Cristóbal Totonicapán' },
        { value: 'san_francisco_el_alto', label: 'San Francisco El Alto' },
        { value: 'san_andres_xecul', label: 'San Andrés Xecul' },
        { value: 'momostenango', label: 'Momostenango' },
        { value: 'santa_maria_chiquimula', label: 'Santa María Chiquimula' },
        { value: 'santa_lucia_la_reforma', label: 'Santa Lucía La Reforma' },
        { value: 'san_bartolo', label: 'San Bartolo' }
    ],
    'zacapa': [
        { value: 'zacapa', label: 'Zacapa' },
        { value: 'estanzuela', label: 'Estanzuela' },
        { value: 'rio_hondo', label: 'Río Hondo' },
        { value: 'gualan', label: 'Gualán' },
        { value: 'teculutan', label: 'Teculután' },
        { value: 'usumatlan', label: 'Usumatlán' },
        { value: 'cabanas', label: 'Cabañas' },
        { value: 'san_diego', label: 'San Diego' },
        { value: 'la_union', label: 'La Unión' },
        { value: 'huite', label: 'Huité' },
        { value: 'san_jorge', label: 'San Jorge' }
    ]
};

/**
 * Géneros permitidos.
 */
export const GENEROS = [
    { value: 'masculino', label: 'Masculino' },
    { value: 'femenino', label: 'Femenino' }
];

/**
 * Bancos permitidos.
 * Nota: Según requerimiento, solo se permite Banrural.
 */
export const BANCOS = [
    { value: 'banrural', label: 'Banrural' }
];

/**
 * Tipos de Cuenta Bancaria.
 */
export const TIPOS_CUENTA = [
    { value: 'monetaria', label: 'Monetaria' },
    { value: 'ahorro', label: 'Ahorro' }
];

/**
 * Tipos de Relación para Referencias.
 */
export const RELACIONES = [
    { value: 'personal', label: 'Personal' },
    { value: 'familiar', label: 'Familiar' }
];

/**
 * Tipos de Distribuidor.
 */
export const TIPOS_DISTRIBUIDOR = [
    { value: 'pequeno', label: 'Pequeño Contribuyente' },
    { value: 'sa', label: 'Sociedad Anónima (S.A.)' }
];

/**
 * Formas de Cálculo del IVA.
 */
export const FORMAS_IVA = [
    { value: 'general', label: 'General (12%)' },
    { value: 'pequeno', label: 'Pequeño Contribuyente (5%)' }
];

/**
 * Regímenes Tributarios.
 */
export const REGIMENES = [
    { value: 'isr_opcional', label: 'ISR Opcional Simplificado' },
    { value: 'isr_utilidades', label: 'ISR Sobre Utilidades' },
    { value: 'pequeno_contribuyente', label: 'Pequeño Contribuyente' }
];