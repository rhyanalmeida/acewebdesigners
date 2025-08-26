import React from 'react';
import { ExternalLink, Code, Palette, Trophy, ArrowRight } from 'lucide-react';

function Work() {
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

  return (
    <div className="pt-24 pb-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden mb-16">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-blue-800"></div>
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1460925895917-afdab827c52f?ixlib=rb-4.0.3')] opacity-10 bg-cover bg-center"></div>
        <div className="max-w-7xl mx-auto px-4 relative">
          <div className="py-20 text-center text-white">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">Our Portfolio</h1>
            <p className="text-xl text-blue-100 max-w-2xl mx-auto">
              Explore our latest projects and see how we help businesses transform their digital presence
            </p>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4">
        {/* Projects Grid */}
        <section>
          <div className="inline-flex items-center gap-2 bg-blue-50 px-4 py-2 rounded-full mb-8">
            <Trophy className="w-4 h-4 text-blue-600" />
            <span className="text-blue-800 font-medium">Featured Projects</span>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {projects.map((project, index) => (
              <article key={index} className="group relative overflow-hidden rounded-2xl bg-white shadow-lg hover:shadow-xl transition-all flex flex-col h-full">
                <div className="aspect-[4/3] overflow-hidden">
                  <img 
                    src={project.image}
                    alt={project.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    loading="lazy"
                  />
                </div>
                <div className="p-6 flex flex-col flex-grow">
                  <div className="text-sm text-blue-600 font-medium mb-2">{project.category}</div>
                  <h3 className="text-xl font-bold mb-2">{project.title}</h3>
                  <p className="text-gray-600 mb-4 text-sm line-clamp-3">{project.description}</p>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {project.technologies && project.technologies.slice(0, 2).map((tech, techIndex) => (
                      <span key={techIndex} className="bg-blue-50 text-blue-700 px-2 py-1 rounded-full text-xs">
                        {tech}
                      </span>
                    ))}
                  </div>
                  {project.link ? (
                    <a
                      href={project.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-auto flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium group/btn text-sm"
                    >
                      Visit Website
                      <ExternalLink className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                    </a>
                  ) : (
                    <button className="mt-auto flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium group/btn text-sm">
                      View Details
                      <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                    </button>
                  )}
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* Project Details Section */}
        <section className="mt-20">
          <h2 className="text-3xl font-bold mb-10 text-center">Project Highlights</h2>
          
          {/* Hot Pot One Details */}
          <div className="grid md:grid-cols-2 gap-12 items-center mb-20">
            <div>
              <div className="inline-flex items-center gap-2 bg-blue-50 px-3 py-1 rounded-full mb-4">
                <span className="text-blue-800 font-medium text-sm">Featured Restaurant</span>
              </div>
              <h3 className="text-2xl font-bold mb-4">{projects[0].title}</h3>
              <p className="text-gray-600 mb-6">{projects[0].description}</p>
              <div className="space-y-6">
                <div>
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <Code className="w-5 h-5 text-blue-600" />
                    Technologies Used
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {projects[0].technologies.map((tech, index) => (
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
                    {projects[0].features.map((feature, index) => (
                      <span key={index} className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm">
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
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-blue-800 rounded-2xl transform rotate-3"></div>
              <a 
                href={projects[0].link}
                target="_blank"
                rel="noopener noreferrer"
                className="block relative group"
              >
                <img 
                  src={projects[0].image}
                  alt={projects[0].title}
                  className="rounded-2xl relative shadow-xl transform -rotate-2 transition-transform duration-300 group-hover:rotate-0 w-full object-cover aspect-[4/3]"
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
      </div>
    </div>
  );
}

export default Work;