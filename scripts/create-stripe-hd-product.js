/**
 * Script pour créer le produit HD Unlock sur Stripe
 * Usage: STRIPE_SECRET_KEY=sk_test_xxx node scripts/create-stripe-hd-product.js
 */

require('dotenv').config({ path: '.env.local' });
const Stripe = require('stripe');

// Clé Stripe depuis variable d'environnement
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
});

if (!process.env.STRIPE_SECRET_KEY) {
  console.error('❌ STRIPE_SECRET_KEY non définie. Ajoutez-la dans .env.local');
  process.exit(1);
}

async function createHDProduct() {
  console.log('🚀 Création du produit HD Unlock sur Stripe...\n');

  try {
    // 1. Créer le produit
    const product = await stripe.products.create({
      name: 'Image HD sans filigrane',
      description: 'Téléchargez votre création InstaDeco en haute définition sans filigrane',
      metadata: {
        type: 'hd_unlock',
      },
    });

    console.log('✅ Produit créé:', product.id);
    console.log('   Nom:', product.name);

    // 2. Créer le prix (1.99€)
    const price = await stripe.prices.create({
      product: product.id,
      unit_amount: 199, // 1.99€ en centimes
      currency: 'eur',
      metadata: {
        type: 'hd_unlock',
      },
    });

    console.log('\n✅ Prix créé:', price.id);
    console.log('   Montant: 1.99€');

    console.log('\n' + '='.repeat(50));
    console.log('📋 CONFIGURATION À AJOUTER:');
    console.log('='.repeat(50));
    console.log(`\nAjoutez cette variable dans votre .env.local ET sur Vercel:\n`);
    console.log(`STRIPE_PRICE_HD_UNLOCK=${price.id}`);
    console.log('\n' + '='.repeat(50));

    return { product, price };

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    throw error;
  }
}

createHDProduct();
