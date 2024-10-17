export default {
	async fetch(request, env, ctx) {
	  return await handleRequest(request, env);
	},
  };

  function replaceText(content, replacements) {
	for (const [searchValue, newValue] of Object.entries(replacements)) {
	  const regex = new RegExp(searchValue, 'g');
	  content = content.replace(regex, newValue);
	}
	return content;
  }
  
  async function parseResponseByContentType(response, contentType, path) {
	if (!contentType) return await response.text();
  
	const replacements = {
	  'https://app.revolt.chat': 'https://revolt.veygax.dev',
	  'https://rvlt.gg': 'https://revolt.veygax.dev/rvltgg',
	};
  
	switch (true) {
		case contentType.includes('application/json'): {
			const jsonData = await response.json();
			
			if (path.endsWith('/messages') && Array.isArray(jsonData)) {
				return JSON.stringify({ messages: jsonData, users: [] });
			}
		  
			return JSON.stringify(jsonData); 
		  }
		case contentType.includes('text/html'):
		case contentType.includes('application/javascript'):
		case contentType.includes('text/javascript'): {
		  let originalText = await response.text();
	
		  const updatedText = replaceText(originalText, replacements);
	
		  if (contentType.includes('text/html')) {
			const transformedResponse = new HTMLRewriter()
			  .on('body', {
				element(element) {
				  element.append(
					`
					  <style>
					  /* Custom CSS */
					  </style>
					`,
					{ html: true }
				  );
				  element.append(
					`
					  <script>
					  // Custom JS
					  </script>
					`,
					{ html: true }
				  );
				},
			  })
			  .transform(new Response(updatedText, response));
			return await transformedResponse.text();
		  }
		  
		  return updatedText;
		}
		case contentType.includes('font'):
		case contentType.includes('image'):
		  return await response.arrayBuffer();
		default:
		  return await response.text();
	  }
  }
  
  async function handleRequest(request, env) {
	let path = new URL(request.url).pathname;
	let url = 'https://app.revolt.chat' + path;
  
	if (path.startsWith('/rvltgg')) {
		url = 'https://rvlt.gg' + path.replace('/rvltgg', '');
	  } else {
		url = 'https://app.revolt.chat' + path;
	  }

	  
	if (path === '/') {
	  url = `https://app.revolt.chat/`;
	}
  
	let headers = {
	  'Access-Control-Allow-Origin': '*',
	  'Access-Control-Allow-Methods': 'GET,HEAD,POST,OPTIONS',
	};
  
	const response = await fetch(url, {
	  method: request.method,
	  headers: request.headers,
	  body: request.method === 'POST' ? request.body : undefined, 
	});

	const contentType = response.headers.get('content-type');
	let results = await parseResponseByContentType(response, contentType, path);
  
	headers['content-type'] = contentType;
  
	return new Response(results, { headers });
  }
  
  