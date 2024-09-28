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
  
  async function parseResponseByContentType(response, contentType) {
	if (!contentType) return await response.text();
  
	const replacements = {
	  'https://discord\\.gg/8rJvDWaSz7': 'https://dsc.gg/veygax',
	  'My Bento': 'Made by Bento',
	  'https://storage.googleapis.com/creatorspace-public/users%2Fcm12hue9s01o8sk016zddtr46%2F4qOYTn3HnEsITwkL-dark%252Cen%252Cbadge%252Cgroup.png': 'https://card.yuy1n.io/card/76561199197283635/dark,en,badge,group',
	};
  
	switch (true) {
	  case contentType.includes('application/json'):
		return JSON.stringify(await response.json());
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
	const path = new URL(request.url).pathname;
	let url = 'https://bento.me' + path;
  
	if (path.includes('v1')) {
	  url = 'https://api.bento.me' + path;
	}
  
	if (url === 'https://bento.me/') {
	  url = `https://bento.me/${env.BENTO_USERNAME}`;
	}
  
	let headers = {
	  'Access-Control-Allow-Origin': '*',
	  'Access-Control-Allow-Methods': 'GET,HEAD,POST,OPTIONS',
	};
  
	const response = await fetch(url, { headers });
	const contentType = response.headers.get('content-type');
	let results = await parseResponseByContentType(response, contentType);
  
	if (!(results instanceof ArrayBuffer)) {
	  results = results.replaceAll('https://api.bento.me', env.BASE_URL);
	}
  
	headers['content-type'] = contentType;
  
	return new Response(results, { headers });
  }
  