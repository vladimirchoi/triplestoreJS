/*
 * $Id$
 * This library enables web applications to easily store triples into Web Storage.
 * See Copyright for the status of this software.
 * uchida@w3.org
 */

/**
 * Triplestore wrapper for HTML5 WebStorage.
 * @main Triplestore
 * @class Triplestore
 * @constructor
 * @uses localStorage
 */
var Triplestore = function() {
  this.st = localStorage;
  this.prefixMapping = {};
};

(function(){
  resolveQName = function(prefixMapping, qname) {
    if(!qname) {
      return null;
    }
    var resolved = null;
    if(isAbsoluteURI(qname)) {
      resolved = qname;
    } else {
      var index = qname.indexOf(":");
      if(index == -1) {
        resolved = qname;
      } else {
        var prefix = qname.substr(0, index);
        var iri = prefixMapping[prefix];
        if(iri) {
          resolved = iri + qname.substr(index + 1);
        } else {
          resolved = qname;
        }
      }
    }
    return resolved;
  };
  /**
   * Parse a URI string into JSON object.
   * @private
   * @method parseURI
   * @param uri_str {String} URL string
   * @return {Object} URI object
   */
  parseURI = function(uri_str) {
    var uri = document.createElement('a');
    uri.href = uri_str;
    return uri;
  };
  isAbsoluteURI = function(url_str) {
    var index = url_str.indexOf("://");
    return index == -1 ? false : true;
  };
  /**
   * Sets a mapping given a mapping and a URI to map.
   * @method setMapping
   * @param mapping {String} mapping
   * @param iri {String} iri
   * @example
   *   st.setMapping("foaf", "http://xmlns.com/foaf/0.1/");
   */
  Triplestore.prototype.setMapping = function(mapping, iri) {
    this.prefixMapping[mapping] = iri;
  };
  /**
   * Retrieves a list of DOMStrings which are IRI identifiers for
   * subjects given an optional property and value to match against.
   * @method getSubjects
   * @param [property] {String} property
   * @param [value] {String} value
   * @return {Array} Sequence&lt;DOMString>
   * @example
   *   st.getSubjects("foaf:name", "Bob");
   */
  Triplestore.prototype.getSubjects = function(property, value) {
    //init
    property = resolveQName(this.prefixMapping, property);
    value = resolveQName(this.prefixMapping, value);
    
    var res = [];
    for(var subject in this.st) {
      var props_str = this.st.getItem(subject);
      var props = JSON.parse(props_str);
      
      if(property) {
        if(value) {
          if(props[property] == value) {
            res.push(subject);
          }
        } else {
          if(props[property]) {
            res.push(subject);
          }
        }
      } else {
        for(var prop in props) {
          if(!value || props[prop] == value) {
            res.push(subject);
            break;
          }
        }
      }
    }
    return res;
  };
  /**
   * Retrieves a list of DOMStrings which are IRI identifiers for
   * properties given an optional subject to match against.
   * @method getProperties
   * @param [subject] {String} subject
   * @return {Array} Sequence&lt;DOMString>
   * @example
   *   st.getProperties("http://sample.org/bob");
   */
  Triplestore.prototype.getProperties = function(subject) {
    if(subject) {
      //init
      subject = resolveQName(this.prefixMapping, subject);
      
      var props_str = this.st.getItem(subject);
      var props = JSON.parse(props_str);
      var res = [];
      for(var prop in props) {
        res.push(prop);
      }
      return res; 
    } else {
      var map = [];
      for(subject in this.st) {
        var props_str = this.st.getItem(subject);
        var props = JSON.parse(props_str);
        for(var prop in props) {
          map[prop] = null;
        }
      }
      var res = [];
      for(var key in map) {
        res.push(key);
      }
      return res;
    }
  };
  /**
   * Retrieves a list of mixed types given an optional subject
   * and property to match against.
   * @method getValues
   * @param [subject] {String} subject
   * @param [property] {String} property
   * @return {Array} Sequence&lt;any>
   * @example
   *   st.getValues("http://sample.org/bob", "foaf:name");
   */
  Triplestore.prototype.getValues = function(subject, property) {
    //init
    subject = resolveQName(this.prefixMapping, subject);
    property = resolveQName(this.prefixMapping, property);
    
    var subjects = [];
    if(subject) {
      subjects.push(subject);
    } else {
      for(var subject in this.st) {
        subjects.push(subject);
      }
    }
    
    var res = [];
    for(var i = 0; i < subjects.length; i++) {
      var subject = subjects[i];
      var props_str = this.st.getItem(subject);
      if(props_str) {
        var props = JSON.parse(props_str);
      
        if(property) {
          if(props[property]) {
            res.push(props[property]);
          }
        } else {
          for(var prop in props) {
            res.push(props[prop]);
          }
        }
      }
    }
    return res;
  };
  /**
   * Store a triple to localStorage.
   * @method push
   * @param subject {String} subject
   * @param property {String} property
   * @param object {String} object
   * @example
   *   st.push("http://sample.org/bob", "foaf:name", "Bob");
   */
  Triplestore.prototype.push = function(subject, property, object) {
    //init
    subject = resolveQName(this.prefixMapping, subject);
    property = resolveQName(this.prefixMapping, property);
    object = resolveQName(this.prefixMapping, object);
    
    var props_str = this.st[subject];
    if(props_str) {
      var props = JSON.parse(props_str);
      props[property] = object;
      this.st.setItem(subject, JSON.stringify(props));
    } else {
      var props = {};
      props[property] = object;
      this.st.setItem(subject, JSON.stringify(props)); 
    }
  };
  /**
   * Remove an subject or a property from internal storage to match against.
   * @method remove
   * @param [subject] {String} subject
   * @param [property] {String} property
   */
  Triplestore.prototype.remove = function(subject, property) {
    //init
    subject = resolveQName(this.prefixMapping, subject);
    property = resolveQName(this.prefixMapping, property);
    
    if(subject) {
      if(property) {/* remove the property */
        var props_str = this.st[subject];
        if(props_str) {
          var props = JSON.parse(props_str);
          delete props[property];
          this.st.setItem(subject, JSON.stringify(props));
        } else {
          throw Error("Not found " + subject + ":" + property);
        }
      } else {/* remove the subject */
        this.st.removeItem(subject);
      }
    } else {
      if(property) {/* remove all matched properties */
        for(var subject in this.st) {
          var props_str = this.st[subject];
          var props = JSON.parse(props_str);
          if(props[property]) {
            delete props[property];
            this.st.setItem(subject, JSON.stringify(props));
          }
        }
      } else {
        this.st.clear();  
      }
    }
  };
  /**
   * Print the content of the storage.
   * @method show
   */
  Triplestore.prototype.show = function() {
    for(var i = 0; i < this.st.length; i++) {
      var subject = this.st.key(i);
      console.log(subject + ":" + this.st.getItem(subject));
    }
  };
})();
 