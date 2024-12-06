const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const cli = require('@caporal/core').default;
const { VCard, GestionVCard } = require('./vCard');

const dataFolderPath = path.join(__dirname, 'data', 'gift');
const personalCollectionPath = path.join(__dirname, 'data', 'personal_collection.json');

const CollectionQuestions = require('./CollectionQuestions');
const {Question, CollectionQuestion } = require('./Question');
const gestionVCard = new GestionVCard();

cli
    .version('1.0.0')
    .description('Outil CLI pour gérer les fichiers GIFT')

    // check
    .command('check', 'Vérifier si tous les fichiers GIFT du dossier sont valides')
    .argument('<collection>', 'Nom complet sans extension du fichier de collection')
    .option('-f, --format', 'Vérifier le formattage du fichier gift', { validator: cli.BOOLEAN, default: false })
    .action(({ args, options, logger }) => {
        const collectionPath = path.join(dataFolderPath, `${args.collection}.gift`);
        try {
            const collectionQuestions = new CollectionQuestions();
            const data = fs.readFileSync(collectionPath, 'utf8'); 
            const questions = collectionQuestions.chargeExamQuestions(data, collectionPath, false);
            if (options.format) {
                collectionQuestions.chargeExamQuestions(data, collectionPath, true); 
            }
            collectionQuestions.verifyQuality(questions);
        } catch (err) {
            console.error('Erreur de lecture du fichier :', err);
            return 0; 
        }
    })

    // list
    // list
    .command('list', 'Afficher toutes les questions')
    .option('-t, --type <type>', 'Filtrer les questions par type', { validator: cli.STRING, default: '' }) // Ajout de l'option pour filtrer par type
    .action(({ logger, options }) => {
        try {
            const collectionQuestions = new CollectionQuestions();
            const allQuestions = collectionQuestions.chargeAllFolderQuestions(false); // Charger toutes les questions
    
            // Log des types de questions
            logger.info("Types de questions présentes :");
            allQuestions.forEach(q => {
                logger.info(q.typeDeQuestion); // Affiche les types de questions
            });
    
            let filteredQuestions = allQuestions;
    
            // Si un type est spécifié, filtrer les questions par type
            if (options.type) {
                filteredQuestions = allQuestions.filter(q => q.typeDeQuestion === options.type);
            }
    
            // Afficher les questions filtrées
            if (filteredQuestions.length > 0) {
                collectionQuestions.logQuestions(filteredQuestions); 
            } else {
                logger.info(`Aucune question trouvée pour le type "${options.type}".`);
            }
        } catch (error) {
            logger.error(`Erreur : ${error.message}`);
        }
    })
    

    //view
    .command('view', 'Afficher les questions dans la collection personnelle')
    .action(({ logger }) => {
        try {
            const file = 'personal_collection.json';
            let questions = [];
            if (fs.existsSync(personalCollectionPath)) {
                fs.readFile(personalCollectionPath, 'utf8', (err, data) => {
                    if (err) {
                        return logger.warn(`Erreur de lecture du fichier ${file}: ${err}`);
                    }
                    const collectionQuestions = new CollectionQuestions();
                    const questions = collectionQuestions.chargeExamQuestions(data, file, false); 
                    console.log('La collection personnelle :')
                    collectionQuestions.logQuestions(questions); 
                });
            } else {
                console.log(`Le fichier de collection personnelle n est pas trouvable à l adresse suivante : ${chalk.red(personalCollectionPath)}`);
            }
        } catch (error) {
            logger.error(`Erreur : ${error.message}`);
        }
    })

    // explore
    .command('explore', 'Afficher les questions dans la collection personnelle')
    .argument('<collection>', 'Nom complet sans extension du fichier de collection')
    .action(({ logger, args }) => {
        const collectionPath = path.join(dataFolderPath, `${args.collection}.gift`);
        try {
            const collectionQuestions = new CollectionQuestions();
            const data = fs.readFileSync(collectionPath, 'utf8'); 
            const questions = collectionQuestions.chargeExamQuestions(data, collectionPath, false);
            collectionQuestions.logQuestions(questions); 
        } catch (err) {
            console.error('Erreur de lecture du fichier :', err);
            return 0; 
        }
    })

    // countain
    .command('countain', 'Afficher les questions dans la collection personnelle')
    .argument('<collection>', 'Nom complet sans extension du fichier de collection')
    .argument('<id>', 'ID de la question')
    .action(({ logger, args }) => {
        const collectionPath = path.join(dataFolderPath, `${args.collection}.gift`);
        try {
            const collectionQuestions = new CollectionQuestions();
            const data = fs.readFileSync(collectionPath, 'utf8'); // Lecture synchronisée du fichier
            const questions = collectionQuestions.chargeExamQuestions(data, collectionPath, false);
            const isContained = collectionQuestions.contientQuestions(questions, args.id);
            if (isContained) {
                logger.info(`La question avec l'ID "${args.id}" est présente dans la collection "${args.collection}".`);
            } else {
                logger.info(`La question avec l'ID "${args.id}" n'est PAS présente dans la collection "${args.collection}".`);
            }
        } catch (err) {
            logger.error('Erreur de lecture du fichier :', err);
        }
    })

    // count
    .command('count', 'Compter le nombre de questions dans une collection')
    .argument('<collection>', 'Nom complet sans extension du fichier de collection')
    .action( ({ logger, args }) => {
        try {   
            const collectionQuestions = new CollectionQuestions();
            const nbQuestions = collectionQuestions.compterQuestions(args.collection);
            console.log(chalk.bold(`Total de questions dans la collection ${args.collection} : `) + chalk.gray(nbQuestions));
        } catch (error) {
            logger.error(`Erreur lors de la recherche : ${error.message}`);
        }
    })
   
    // search
    .command('search', 'Rechercher des questions par mot-clé')
    .argument('<motCle>', 'Mot-clé pour rechercher des questions')
    .action( ({ logger, args }) => {
        try {   
            const collectionQuestions = new CollectionQuestions();
            const allQuestions = collectionQuestions.chargeAllFolderQuestions(false);
            logger.info(`Total questions chargées : ${allQuestions.length}`);
            const searchResults = collectionQuestions.search(allQuestions, args.motCle);
            if (searchResults.length === 0) {
                logger.info(`Aucune question trouvée pour le mot-clé : "${args.motCle}".`);
            } else {
                logger.info(`Nombre de résultats : ${searchResults.length}`);
                collectionQuestions.logQuestions(searchResults);
            }
        } catch (error) {
            logger.error(`Erreur lors de la recherche : ${error.message}`);
        }
    })
    
    // select
    .command('select', 'Sélectionner des ID et charger les questions')
    .argument('<id>', 'ID 1')
    .action(({ logger, args }) => {
        try {
            const collectionQuestions = new CollectionQuestions();
            const allQuestions = collectionQuestions.chargeAllFolderQuestions(false);
            collectionQuestions.selectQuestionsFromId(allQuestions, args.id);
        } catch (error) {
        logger.error(`Erreur lors de la sélection des questions : ${error.message}`);
        }
    })
    
    // add
    .command('add', 'Ajouter une question à une  collection')
    .argument('<collection>', 'Nom complet sans extension du fichier de collection')
    .action(({ logger, args }) => {
        try {  
            const collectionQuestions = new CollectionQuestions();
            const collectionPath = path.join(__dirname, 'data', 'gift', `${args.collection}.gift`); 
            collectionQuestions.ajouterQuestions(collectionPath);
        } catch (error) {
            logger.error(`Erreur : ${error.message}`);
        }
    })
    
    // remove
    .command('remove', 'Retirer une question de la collection personnelle')
    .argument('<titre>', 'Titre de la question à retirer')
    .action(({ logger, args }) => {
        try {
            // Load existing collection
            let collection = [];
            if (fs.existsSync(personalCollectionPath)) {
                collection = JSON.parse(fs.readFileSync(personalCollectionPath, 'utf-8'));
            }
    
            // Filter out the question
            const initialLength = collection.length;
            collection = collection.filter(q => q.titre !== args.titre);
    
            if (collection.length < initialLength) {
                fs.writeFileSync(personalCollectionPath, JSON.stringify(collection), 'utf-8');
                logger.info(`Question "${args.titre}" retirée de la collection personnelle.`);
            } else {
                logger.info(`Aucune question trouvée avec le titre "${args.titre}".`);
            }
        } catch (error) {
            logger.error(`Erreur : ${error.message}`);
        }
    })
    
    // create
	.command('create', 'Créer un fichier GIFT à partir des questions sélectionnées')
	.argument('<collection>', 'le nom de l\'examen')
	.action(({ args }) => {
        const collectionQuestions = new CollectionQuestions();
        collectionQuestions.createCollection(args.collection);
	})

    .command('vcard', 'Générer un fichier vCard pour un enseignant')
    .argument('<nom>', 'Nom de l\'enseignant')
    .argument('<prenom>', 'Prénom de l\'enseignant')
    .argument('<email>', 'Adresse e-mail de l\'enseignant')
    .argument('<telephone>', 'Numéro de téléphone de l\'enseignant')
    .option('--organisation <organisation>', 'Nom de l\'organisation', {
        default: 'SRYEM',
    })
    .option('--fichier <fichier>', 'Nom du fichier vCard généré (sans extension)', {
        default: 'enseignant',
    })
    .action(({ args, options, logger }) => {
        try {
            // Créer une instance de VCard
            const vcard = new VCard(
                args.nom,
                args.prenom,
                args.email,
                args.telephone,
                options.organisation
            );

            // Définir le chemin du fichier
            const cheminFichier = `${options.fichier}.vcf`;

            // Générer et sauvegarder la vCard
            gestionVCard.genererEtSauvegarder(vcard, cheminFichier);

            logger.info(`Fichier vCard généré avec succès : ${cheminFichier}`);
        } catch (error) {
            logger.error(`Erreur : ${error.message}`);
        }
    });

cli.run(process.argv.slice(2));