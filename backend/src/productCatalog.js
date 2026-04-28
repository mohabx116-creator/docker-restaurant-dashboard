const productCatalog = [
    {
        name: "Smokehouse Royale Burger",
        description:
            "Flame-seared beef layered with crispy onion rings, smoked glaze, and crisp garden lettuce.",
        price: 15.95,
        imageUrl: "/products/smokehouse-royale-burger.jpg",
        category: "Burgers",
        isAvailable: true,
    },
    {
        name: "Truffle Melt Beef Burger",
        description:
            "Juicy beef burger finished with truffle mayo, melted cheese, and a toasted brioche crown.",
        price: 16.5,
        imageUrl: "/products/truffle-melt-beef-burger.jpg",
        category: "Burgers",
        isAvailable: true,
    },
    {
        name: "Classic Angus Stack",
        description:
            "A double-stacked Angus classic with lettuce, tomato, pickles, and signature house sauce.",
        price: 14.75,
        imageUrl: "/products/classic-angus-stack.jpg",
        category: "Burgers",
        isAvailable: true,
    },
    {
        name: "Spicy Ranch Smash Burger",
        description:
            "Crisp-edged smash patties, spicy ranch dressing, jalapeno heat, and fresh salad crunch.",
        price: 15.25,
        imageUrl: "/products/spicy-ranch-smash-burger.jpg",
        category: "Burgers",
        isAvailable: true,
    },
    {
        name: "Double Cheddar Prime Burger",
        description:
            "Prime beef loaded with double cheddar, caramelized onions, and glossy burger relish.",
        price: 17.25,
        imageUrl: "/products/double-cheddar-prime-burger.jpg",
        category: "Burgers",
        isAvailable: false,
    },
    {
        name: "Bistro Signature Burger",
        description:
            "House signature burger with smoky seasoning, soft brioche, and a balanced savory finish.",
        price: 16.95,
        imageUrl: "/products/bistro-signature-burger.jpg",
        category: "Burgers",
        isAvailable: true,
    },
    {
        name: "Basil Margherita Classico",
        description:
            "Fresh mozzarella, basil leaves, and bright tomato sauce on a crisp artisan crust.",
        price: 12.95,
        imageUrl: "/products/basil-margherita-classico.jpg",
        category: "Pizzas",
        isAvailable: true,
    },
    {
        name: "Firestone Pepperoni Pizza",
        description:
            "A fire-baked favorite with pepperoni heat, bubbling cheese, and a golden edge.",
        price: 13.5,
        imageUrl: "/products/firestone-pepperoni-pizza.jpg",
        category: "Pizzas",
        isAvailable: true,
    },
    {
        name: "Four Cheese Artisan Pizza",
        description:
            "A creamy artisan blend of four cheeses with deep flavor and a delicate crust snap.",
        price: 14.2,
        imageUrl: "/products/four-cheese-artisan-pizza.jpg",
        category: "Pizzas",
        isAvailable: true,
    },
    {
        name: "Mediterranean Veggie Pizza",
        description:
            "Garden vegetables, bright herbs, and a lighter Mediterranean finish on artisan dough.",
        price: 13.8,
        imageUrl: "/products/mediterranean-veggie-pizza.jpg",
        category: "Pizzas",
        isAvailable: true,
    },
    {
        name: "Rustic Mushroom Pizza",
        description:
            "Savory mushroom layers, creamy cheese, and rustic seasoning baked to a warm finish.",
        price: 14.75,
        imageUrl: "/products/rustic-mushroom-pizza.jpg",
        category: "Pizzas",
        isAvailable: false,
    },
    {
        name: "Spicy Chicken Mozzarella Pizza",
        description:
            "Tender chicken, mozzarella richness, and a subtle spicy kick across a stone-baked base.",
        price: 15.1,
        imageUrl: "/products/spicy-chicken-mozzarella-pizza.jpg",
        category: "Pizzas",
        isAvailable: true,
    },
    {
        name: "Creamy Tuscan Alfredo",
        description:
            "Creamy penne Alfredo touched with herbs, vegetables, and a soft Tuscan-style richness.",
        price: 14.4,
        imageUrl: "/products/creamy-tuscan-alfredo.jpg",
        category: "Pasta",
        isAvailable: true,
    },
    {
        name: "Parmesan Chicken Fettuccine",
        description:
            "Parmesan cream tossed with tender chicken and silky pasta ribbons for a classic finish.",
        price: 15.35,
        imageUrl: "/products/parmesan-chicken-fettuccine.jpg",
        category: "Pasta",
        isAvailable: true,
    },
    {
        name: "Spicy Arrabbiata Penne",
        description:
            "A lively arrabbiata profile with bold tomato spice, penne texture, and fresh herb lift.",
        price: 13.95,
        imageUrl: "/products/spicy-arrabbiata-penne.jpg",
        category: "Pasta",
        isAvailable: true,
    },
    {
        name: "Basil Pesto Linguine",
        description:
            "Linguine coated in basil pesto with a bright green note and delicate savory balance.",
        price: 14.65,
        imageUrl: "/products/basil-pesto-linguine.jpg",
        category: "Pasta",
        isAvailable: true,
    },
    {
        name: "Seafood Cream Pasta",
        description:
            "Creamy seafood pasta with a rounded sauce, aromatic garnish, and polished restaurant finish.",
        price: 17.4,
        imageUrl: "/products/seafood-cream-pasta.jpg",
        category: "Pasta",
        isAvailable: false,
    },
    {
        name: "Mushroom Truffle Pasta",
        description:
            "Velvety mushroom pasta accented with truffle depth and a smooth elegant sauce.",
        price: 16.95,
        imageUrl: "/products/mushroom-truffle-pasta.jpg",
        category: "Pasta",
        isAvailable: true,
    },
    {
        name: "Garden Harvest Salad",
        description:
            "A fresh bowl of crisp greens, vegetables, and a clean garden-inspired dressing profile.",
        price: 9.95,
        imageUrl: "/products/garden-harvest-salad.jpg",
        category: "Salads",
        isAvailable: true,
    },
    {
        name: "Grilled Chicken Caesar",
        description:
            "Grilled chicken Caesar with parmesan shavings, crunchy croutons, and creamy dressing.",
        price: 11.25,
        imageUrl: "/products/grilled-chicken-caesar.jpg",
        category: "Salads",
        isAvailable: true,
    },
    {
        name: "Mediterranean Fresh Bowl",
        description:
            "Mediterranean textures with fresh greens, vibrant toppings, and a breezy savory finish.",
        price: 10.9,
        imageUrl: "/products/mediterranean-fresh-bowl.jpg",
        category: "Salads",
        isAvailable: true,
    },
    {
        name: "Avocado Citrus Salad",
        description:
            "Bright citrus notes and avocado softness layered over crisp leaves and a light dressing.",
        price: 11.6,
        imageUrl: "/products/avocado-citrus-salad.jpg",
        category: "Salads",
        isAvailable: true,
    },
    {
        name: "Greek Feta Salad",
        description:
            "Classic Greek salad character with feta richness, garden freshness, and clean herbal notes.",
        price: 10.75,
        imageUrl: "/products/greek-feta-salad.jpg",
        category: "Salads",
        isAvailable: true,
    },
    {
        name: "Chef's Green Signature Salad",
        description:
            "The house green signature with layered textures and a polished all-day menu feel.",
        price: 12.15,
        imageUrl: "/products/chefs-green-signature-salad.jpg",
        category: "Salads",
        isAvailable: false,
    },
    {
        name: "Midnight Chocolate Cake",
        description:
            "A rich dark chocolate slice with glossy ganache and berry garnish for a dramatic finish.",
        price: 7.4,
        imageUrl: "/products/midnight-chocolate-cake.jpg",
        category: "Desserts",
        isAvailable: true,
    },
    {
        name: "Vanilla Berry Cheesecake",
        description:
            "Silky vanilla cheesecake finished with berry brightness and a clean premium presentation.",
        price: 7.8,
        imageUrl: "/products/vanilla-berry-cheesecake.jpg",
        category: "Desserts",
        isAvailable: true,
    },
    {
        name: "Caramel Lava Delight",
        description:
            "Warm dessert comfort with caramel depth, soft center texture, and elegant plated appeal.",
        price: 8.1,
        imageUrl: "/products/caramel-lava-delight.jpg",
        category: "Desserts",
        isAvailable: true,
    },
    {
        name: "Tiramisu Cream Slice",
        description:
            "A creamy layered tiramisu-inspired slice with smooth coffee-cream richness and soft dusting.",
        price: 7.65,
        imageUrl: "/products/tiramisu-cream-slice.jpg",
        category: "Desserts",
        isAvailable: true,
    },
    {
        name: "Red Velvet Luxe Cake",
        description:
            "Velvet crumb and refined frosting in a polished dessert piece designed for premium menus.",
        price: 8.25,
        imageUrl: "/products/red-velvet-luxe-cake.jpg",
        category: "Desserts",
        isAvailable: true,
    },
    {
        name: "Dark Cocoa Mousse",
        description:
            "Deep cocoa flavor in a soft mousse-forward dessert with a smooth, indulgent finish.",
        price: 6.95,
        imageUrl: "/products/dark-cocoa-mousse.jpg",
        category: "Desserts",
        isAvailable: true,
    },
    {
        name: "Fresh Citrus Cooler",
        description:
            "A chilled citrus-forward cooler with bright acidity and a clean refreshing finish.",
        price: 4.95,
        imageUrl: "/products/fresh-citrus-cooler.jpg",
        category: "Drinks",
        isAvailable: true,
    },
    {
        name: "Iced Berry Refresher",
        description:
            "A berry-led iced refresher with crisp sparkle, vivid color, and a modern café profile.",
        price: 5.2,
        imageUrl: "/products/iced-berry-refresher.jpg",
        category: "Drinks",
        isAvailable: true,
    },
    {
        name: "Mint Lemon Sparkle",
        description:
            "Mint and lemon lifted with a sparkling finish for a refreshing all-day beverage option.",
        price: 4.85,
        imageUrl: "/products/mint-lemon-sparkle.jpg",
        category: "Drinks",
        isAvailable: true,
    },
    {
        name: "Tropical Orange Press",
        description:
            "A smooth tropical orange drink with juicy sweetness and bright, easy-drinking energy.",
        price: 5.4,
        imageUrl: "/products/tropical-orange-press.jpg",
        category: "Drinks",
        isAvailable: true,
    },
    {
        name: "Cold Brew Cream",
        description:
            "A deep roast chilled beverage softened with creamy balance and a premium café mood.",
        price: 5.95,
        imageUrl: "/products/cold-brew-cream.jpg",
        category: "Drinks",
        isAvailable: false,
    },
    {
        name: "Signature House Mocktail",
        description:
            "A layered house mocktail with restaurant-style presentation and a bright aromatic finish.",
        price: 6.25,
        imageUrl: "/products/signature-house-mocktail.jpg",
        category: "Drinks",
        isAvailable: true,
    },
    {
        name: "Sunrise Citrus Fizz",
        description:
            "A sparkling sunrise-style citrus drink with layered color, chilled ice, and vibrant lift.",
        price: 5.55,
        imageUrl: "/products/sunrise-citrus-fizz.jpg",
        category: "Drinks",
        isAvailable: true,
    },
];

module.exports = productCatalog;
