var viewHelpers = {
	a: function(href,text,target) {
		target = target || '_self';
		return "<a href='"+href+"' target='"+target+"'>"+text+"</a>";
	},
	strong: function(text) {
		return "<strong>"+text+"</strong>";
	}
};

module.exports = viewHelpers;