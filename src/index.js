const { html, unsafeHTML } = require('lit-html');
const prism = require('prismjs');
const loadLanguages = require('prismjs/components/');
const generateQuery = require('./queryGenerator');

loadLanguages(['graphql']);

module.exports = (page, schema) => {
    const query = generateQuery(page.name, page.type === 'query' ? 'Query' : 'Mutation', '', {}, {}, [], 0, schema);
    page.page.push({
        name: 'input',
        type: 'lit-html',
        value: html`
            <div class="documents">
                <h3>Documents:</h3>
                <section class="code">
                    <pre class="language-graphql">${unsafeHTML(prism.highlight(query.queryStr, prism.languages.graphql, 'graphql'))}</pre>
                </section>
            </div>`
    });
    return page.page;
};
