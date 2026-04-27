require('dotenv').config();
const mongoose = require('mongoose');
const slugify = require('slugify');
const Category = require('./src/models/Category'); // make sure this path is correct

// Categories with ImageKit images
const categories = [{
        name: "Jewelry",
        description: "Handcrafted necklaces, bracelets, and earrings",
        image: {
            url: "https://ik.imagekit.io/zhxdbfzde/Jewelry.jpg",
            fileId: "69bb012c5c7cd75eb85e9146"
        }
    },
    {
        name: "Pottery",
        description: "Handmade ceramic bowls, mugs, and decorative items",
        image: {
            url: "https://ik.imagekit.io/zhxdbfzde/Pottery.jpg",
            fileId: "69bb01135c7cd75eb85dd93d"
        }
    },
    {
        name: "Wood Carvings",
        description: "Wood-carved furniture and decor",
        image: {
            url: "https://ik.imagekit.io/zhxdbfzde/WoodenCarving.jpg",
            fileId: "69bb010f5c7cd75eb85db6f1"
        }
    },
    {
        name: "Textiles",
        description: "Traditional fabrics, clothing, and woven items",
        image: {
            url: "https://ik.imagekit.io/zhxdbfzde/Textiles.jpg",
            fileId: "69bb011b5c7cd75eb85e11c3"
        }
    },
    {
        name: "Paintings",
        description: "Original artwork and paintings by local artists",
        image: {
            url: "https://ik.imagekit.io/zhxdbfzde/Paintings.jpg",
            fileId: "69bb01275c7cd75eb85e7390"
        }
    },
    {
        name: "Sculptures",
        description: "Stone and metal sculptures",
        image: {
            url: "https://ik.imagekit.io/zhxdbfzde/Sculpture.jpg",
            fileId: "69bb01165c7cd75eb85def8f"
        }
    },
    {
        name: "Baskets",
        description: "Handwoven baskets and storage items",
        image: {
            url: "https://ik.imagekit.io/zhxdbfzde/Basketry.jpg",
            fileId: "69bb01255c7cd75eb85e6adc"
        }
    },
    {
        name: "Tutorials",
        description: "Step-by-step guides for various crafts",
        image: {
            url: "https://ik.imagekit.io/zhxdbfzde/Tutorials.png",
            fileId: "69bb012c5c7cd75eb85e9146"
        }
    },
    {
        name: "Musical Instruments",
        description: "Handcrafted musical instruments",
        image: {
            url: "https://ik.imagekit.io/zhxdbfzde/MusicalInstruments.webp",
            fileId: "69bb01125c7cd75eb85dd4c8"
        }
    },
    {
        name: "Weaving",
        description: "Handwoven textiles and fabrics",
        image: {
            url: "https://ik.imagekit.io/zhxdbfzde/Weaving.jpg",
            fileId: "69bb012d5c7cd75eb85e9645"
        }
    }
];

const seedCategories = async() => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("✅ MongoDB Connected");

        // Clear existing categories
        await Category.deleteMany();
        console.log("🗑️ Old categories removed");

        // Add slug automatically
        const formattedCategories = categories.map(cat => ({
            ...cat,
            slug: slugify(cat.name, { lower: true })
        }));

        // Insert into DB
        await Category.insertMany(formattedCategories);
        console.log("🚀 Categories seeded successfully with images!");

        process.exit();
    } catch (error) {
        console.error("❌ Seeding error:", error);
        process.exit(1);
    }
};

seedCategories();