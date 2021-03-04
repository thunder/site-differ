# Site-Differ

Site-Differ validates that your site doesn't change when you do some background refactoring. 
It downloads all pages that are linked in the sitemap.xml before and after the refactoring and compares them.

## Requirements

* node.js v14

## Installation

Just download this project.

``
git clone https://github.com/thunder/site-differ.git
``

## Validation

The steps to validate your site are:

1. Download all pages for the first time `node index.js`
2. Do your refactoring
3. Download all pages for the second time `node index.js`
