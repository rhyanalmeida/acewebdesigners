import React, { useState } from 'react';
import { ExternalLink, Code, Palette, Trophy, ArrowRight, Filter, Search } from 'lucide-react';

function Work() {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');

  React.useEffect(() => {
    document.title = 'Our Work | Web Design Portfolio in Leominster';
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', 'Explore our web design and development portfolio. View our latest projects and see how we help businesses in Leominster achieve their digital goals.');
    }
  }, []);

  const projects = [
    {
      title: "Hot Pot One",
      category: "Restaurant Website",
      description: "A modern, user-friendly website for Hot Pot One restaurant featuring an intuitive menu system, online ordering capabilities, and seamless mobile experience.",
      image: "https://i.ibb.co/r2g1Q1Qp/hotpotonegif.gif",
      link: "https://hotpotone.net/",
      technologies: ["React", "Tailwind CSS", "Node.js"],
      features: ["Online Ordering", "Menu Management", "Mobile Responsive"],
    },
    {
      title: "Conuco Takeout",
      category: "Restaurant Website",
      description: "An authentic Dominican cuisine takeout restaurant website featuring their family recipes, online ordering system, and vibrant food photography.",
      image: "https://i.ibb.co/Myx4nrSr/concuo-gif.gif",
      link: "https://conucotakeout.com/",
      technologies: ["React", "Tailwind CSS", "Firebase"],
      features: ["Online Ordering", "Menu Showcase", "Mobile Responsive"],
    },
    {
      title: "Dunn Construction",
      category: "Construction Website",
      description: "A professional website for a construction company showcasing their services, past projects, and testimonials from satisfied clients.",
      image: "https://i.ibb.co/S1Yv7K9/dunn-consturction-gif.gif",
      link: "https://dunnconstruction.com/",
      technologies: ["React", "Tailwind CSS", "Next.js"],
      features: ["Project Gallery", "Service Listings", "Contact Forms"],
    },
    {
      title: "Corporate Website",
      category: "Business Website",
      description: "A professional corporate website showcasing services, team members, and company achievements with a modern design.",
      image: "https://images.unsplash.com/photo-1551434678-e076c223a692?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=2070&q=80",
      technologies: ["React", "Tailwind CSS", "GraphQL"],
      features: ["Custom CMS", "Blog System", "Team Profiles"],
    }
  ];

  const categories = ['All', ...new Set(projects.map(project => project.category))];
  
  const filteredProjects = projects.filter(project => {
    const matchesCategory = selectedCategory === 'All' || project.category === selectedCategory;
    const matchesSearch = project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="pt-24 pb-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden mb-16">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-purple-600 to-blue-800 animate-gradient-shift"></div>
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1460925895917-afdab827c52f?ixlib=rb-4.0.3')] opacity-10 bg-cover bg-center"></div>
        <div className="absolute top-10 right-10 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-10 left-10 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-float animation-delay-2000"></div>
        <div className="max-w-7xl mx-auto px-4 relative z-10">
          <div className="py-24 text-center text-white">
            <h1 className="heading-xl text-white mb-8 text-shadow-bold animate-fade-in-down">Our Portfolio</h1>
            <p className="text-2xl text-blue-100 max-w-3xl mx-auto leading-relaxed animate-fade-in-up delay-100">
              Explore our latest projects and see how we help businesses transform their digital presence
            </p>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4">
        {/* Filter and Search */}
        <section className="py-12">
          <div className="flex flex-col md:flex-row gap-6 items-center justify-between mb-8">
            <div className="flex flex-wrap gap-3">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-6 py-3 rounded-full font-semibold transition-smooth ${
                    selectedCategory === category
                      ? 'bg-gradient-blue-purple text-white shadow-lg'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search projects..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 pr-4 py-3 border-2 border-gray-200 rounded-full focus:border-blue-500 focus:outline-none transition-smooth w-64"
              />
            </div>
          </div>
        </section>

        {/* Projects Grid */}
        <section>
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-yellow-50 to-blue-50 px-5 py-2 rounded-full mb-12 border border-yellow-100 animate-fade-in-up">
            <Trophy className="w-5 h-5 text-yellow-600" />
            <span className="text-yellow-800 font-semibold">Featured Projects</span>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {filteredProjects.map((project, index) => (
              <article key={index} className={`group relative overflow-hidden rounded-3xl bg-white shadow-xl hover:shadow-2xl transition-smooth hover-lift flex flex-col h-full border-2 border-gray-100 animate-fade-in-up delay-${index * 100}`}>
                <div className="aspect-[4/3] overflow-hidden relative">
                  <img 
                    src={project.image}
                    alt={project.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-125"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-smooth"></div>
                </div>
                <div className="p-8 flex flex-col flex-grow">
                  <div className="text-sm text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 font-bold mb-3 uppercase tracking-wider">{project.category}</div>
                  <h3 className="text-2xl font-bold mb-3 text-gray-900">{project.title}</h3>
                  <p className="text-gray-600 mb-5 text-base line-clamp-3 leading-relaxed">{project.description}</p>
                  <div className="flex flex-wrap gap-2 mb-5">
                    {project.technologies && project.technologies.slice(0, 2).map((tech, techIndex) => (
                      <span key={techIndex} className="bg-gradient-to-r from-blue-50 to-purple-50 text-blue-700 px-3 py-1 rounded-full text-xs font-semibold border border-blue-100">
                        {tech}
                      </span>
                    ))}
                  </div>
                  {project.link ? (
                    <a
                      href={project.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-auto flex items-center gap-2 text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 hover:from-purple-600 hover:to-blue-600 font-bold group/btn text-base transition-smooth"
                    >
                      Visit Website
                      <ExternalLink className="w-5 h-5 text-blue-600 group-hover/btn:translate-x-1 group-hover/btn:text-purple-600 transition-smooth" />
                    </a>
                  ) : (
                    <button className="mt-auto flex items-center gap-2 text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 hover:from-purple-600 hover:to-blue-600 font-bold group/btn text-base transition-smooth">
                      View Details
                      <ArrowRight className="w-5 h-5 text-blue-600 group-hover/btn:translate-x-1 group-hover/btn:text-purple-600 transition-smooth" />
                    </button>
                  )}
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* Project Details Section */}
        <section className="mt-24">
          <h2 className="heading-xl text-gradient-blue mb-16 text-center animate-fade-in-up">Project Highlights</h2>
          
          {/* Hot Pot One Details */}
          <div className="grid md:grid-cols-2 gap-12 items-center mb-24 animate-fade-in-up">
            <div>
              <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-50 to-purple-50 px-4 py-2 rounded-full mb-6 border border-blue-100">
                <span className="text-blue-800 font-bold">🍽️ Featured Restaurant</span>
              </div>
              <h3 className="heading-md text-gray-900 mb-6">{projects[0].title}</h3>
              <p className="text-gray-700 mb-8 text-lg leading-relaxed">{projects[0].description}</p>
              <div className="space-y-6">
                <div>
                  <h4 className="font-bold text-xl mb-4 flex items-center gap-2 text-gray-900">
                    <Code className="w-6 h-6 text-blue-600" />
                    Technologies Used
                  </h4>
                  <div className="flex flex-wrap gap-3">
                    {projects[0].technologies.map((tech, index) => (
                      <span key={index} className="bg-gradient-to-r from-blue-50 to-purple-50 text-blue-700 px-4 py-2 rounded-full text-base font-semibold border border-blue-200 hover:scale-110 transition-smooth">
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="font-bold text-xl mb-4 flex items-center gap-2 text-gray-900">
                    <Palette className="w-6 h-6 text-purple-600" />
                    Key Features
                  </h4>
                  <div className="flex flex-wrap gap-3">
                    {projects[0].features.map((feature, index) => (
                      <span key={index} className="bg-gradient-to-r from-gray-100 to-gray-50 text-gray-800 px-4 py-2 rounded-full text-base font-semibold border border-gray-200 hover:scale-110 transition-smooth">
                        {feature}
                      </span>
                    ))}
                  </div>
                </div>
                <a
                  href={projects[0].link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium group"
                >
                  Visit Website
                  <ExternalLink className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </a>
              </div>
            </div>
            <div className="relative animate-fade-in-right">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 rounded-3xl transform rotate-3 animate-levitate"></div>
              <a 
                href={projects[0].link}
                target="_blank"
                rel="noopener noreferrer"
                className="block relative group"
              >
                <img 
                  src={projects[0].image}
                  alt={projects[0].title}
                  className="rounded-3xl relative shadow-2xl transform -rotate-2 transition-smooth duration-500 group-hover:rotate-0 group-hover:scale-105 w-full object-cover aspect-[4/3] border-4 border-white"
                  loading="lazy"
                />
              </a>
            </div>
          </div>
          
          {/* Conuco Takeout Details */}
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="order-2 md:order-1 relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-blue-800 rounded-2xl transform rotate-3"></div>
              <a 
                href={projects[1].link}
                target="_blank"
                rel="noopener noreferrer"
                className="block relative group"
              >
                <img 
                  src={projects[1].image}
                  alt={projects[1].title}
                  className="rounded-2xl relative shadow-xl transform -rotate-2 transition-transform duration-300 group-hover:rotate-0 w-full object-cover aspect-[4/3]"
                  loading="lazy"
                />
              </a>
            </div>
            <div className="order-1 md:order-2">
              <div className="inline-flex items-center gap-2 bg-blue-50 px-3 py-1 rounded-full mb-4">
                <span className="text-blue-800 font-medium text-sm">Dominican Cuisine</span>
              </div>
              <h3 className="text-2xl font-bold mb-4">{projects[1].title}</h3>
              <p className="text-gray-600 mb-6">{projects[1].description}</p>
              <div className="space-y-6">
                <div>
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <Code className="w-5 h-5 text-blue-600" />
                    Technologies Used
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {projects[1].technologies.map((tech, index) => (
                      <span key={index} className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm">
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <Palette className="w-5 h-5 text-blue-600" />
                    Key Features
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {projects[1].features.map((feature, index) => (
                      <span key={index} className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm">
                        {feature}
                      </span>
                    ))}
                  </div>
                </div>
                <a
                  href={projects[1].link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium group"
                >
                  Visit Website
                  <ExternalLink className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </a>
              </div>
            </div>
          </div>

          {/* Dunn Construction Details */}
          <div className="grid md:grid-cols-2 gap-12 items-center mt-20">
            <div>
              <div className="inline-flex items-center gap-2 bg-blue-50 px-3 py-1 rounded-full mb-4">
                <span className="text-blue-800 font-medium text-sm">Construction Services</span>
              </div>
              <h3 className="text-2xl font-bold mb-4">{projects[2].title}</h3>
              <p className="text-gray-600 mb-6">{projects[2].description}</p>
              <div className="space-y-6">
                <div>
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <Code className="w-5 h-5 text-blue-600" />
                    Technologies Used
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {projects[2].technologies.map((tech, index) => (
                      <span key={index} className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm">
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <Palette className="w-5 h-5 text-blue-600" />
                    Key Features
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {projects[2].features.map((feature, index) => (
                      <span key={index} className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm">
                        {feature}
                      </span>
                    ))}
                  </div>
                </div>
                <a
                  href={projects[2].link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium group"
                >
                  Visit Website
                  <ExternalLink className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </a>
              </div>
            </div>
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-blue-800 rounded-2xl transform rotate-3"></div>
              <a 
                href={projects[2].link}
                target="_blank"
                rel="noopener noreferrer"
                className="block relative group"
              >
                <img 
                  src={projects[2].image}
                  alt={projects[2].title}
                  className="rounded-2xl relative shadow-xl transform -rotate-2 transition-transform duration-300 group-hover:rotate-0 w-full object-cover aspect-[4/3]"
                  loading="lazy"
                />
              </a>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-gradient-to-br from-blue-600 via-purple-600 to-blue-800 relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1451187580459-43490279c0fa?ixlib=rb-4.0.3')] opacity-10"></div>
          <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
            <h2 className="heading-xl text-white mb-6 text-shadow-bold">Get a Design Like These</h2>
            <p className="text-blue-100 text-xl mb-8 leading-relaxed">
              See your website design before paying anything. Love it? Let's build it together.
            </p>
            <button 
              onClick={() => {
                window.location.href = '/contact';
              }}
              className="bg-white text-blue-600 px-10 py-5 rounded-full font-bold hover:bg-blue-50 transition-smooth hover:scale-110 inline-flex items-center group text-xl shadow-2xl animate-glow-pulse"
            >
              <span className="animate-slide-right-left">👉 GET MY FREE DESIGN NOW!</span>
              <ArrowRight className="ml-2 w-6 h-6 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}

export default Work;