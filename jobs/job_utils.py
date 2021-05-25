# coding: utf-8
#
# Copyright 2021 The Oppia Authors. All Rights Reserved.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#      http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS-IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

"""Helper functions for beam validators and one-off jobs."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import itertools
import operator

from core.platform import models
import feconf

from apache_beam.io.gcp.datastore.v1new import types as beam_datastore_types
from google.appengine.api import datastore_types
from google.appengine.datastore import datastore_query
from google.appengine.ext.ndb import query as ndb_query

datastore_services = models.Registry.import_datastore_services()

(base_models,) = models.Registry.import_models([models.NAMES.base_model])


def clone_model(model, **new_values):
    """Clones the entity, adding or overriding constructor attributes.

    The cloned entity will have exactly the same property values as the
    original entity, except where overridden. By default, it will have no
    parent entity or key name, unless supplied.

    IMPORTANT: This function should be used in EVERY DoFn, beacse one of Apache
    Beam's invariants is that all input values are IMMUTABLE.
    TODO(#12449): Use a metaclass to wrap DoFn.process() with a function that
    clones inputs, so that contributors don't need to remember to.

    Args:
        model: datastore_services.Model. Model to clone.
        **new_values: dict(str: *). Keyword arguments to override when
            invoking the cloned entity's constructor.

    Returns:
        datastore_services.Model. A cloned, and possibly modified, copy of self.
        Subclasses of BaseModel will return a clone with the same type.
    """
    # Reference implementation: https://stackoverflow.com/a/2712401/4859885.
    model_id = new_values.pop('id', None) or get_model_id(model)
    cls = model.__class__
    props = {k: v.__get__(model, cls) for k, v in cls._properties.items()} # pylint: disable=protected-access
    props.update(new_values)
    return cls(id=model_id, **props)


def get_model_key(model):
    """Returns the given model's key.

    Args:
        model: datastore_services.Model. The model to inspect.

    Returns:
        datastore_services.Key. The model's key.

    Raises:
        TypeError. When the argument is not a model.
    """
    if isinstance(model, datastore_services.Model):
        return model.key
    else:
        raise TypeError('%r is not a model instance' % model)


def get_model_kind(model):
    """Returns the "kind" of the given model.

    NOTE: A model's kind is usually, but not always, the same as a model's class
    name. Specifically, the kind is different when a model overwrites the
    _get_kind() class method. Although Oppia never does this, the Apache Beam
    framework uses "kind" to refer to models extensively, so we follow the same
    convention and take special care to always return the correct value.

    Args:
        model: datastore_services.Model. The model to inspect.

    Returns:
        bytes. The model's kind.

    Raises:
        TypeError. When the argument is not a model.
    """
    if isinstance(model, datastore_services.Model) or (
            isinstance(model, type) and
            issubclass(model, datastore_services.Model)):
        return model._get_kind() # pylint: disable=protected-access
    else:
        raise TypeError('%r is not a model type or instance' % model)


def get_model_id(model):
    """Returns the given model's ID.

    Args:
        model: datastore_services.Model. The model to inspect.

    Returns:
        bytes. The model's ID.

    Raises:
        TypeError. When the argument is not a model.
    """
    if isinstance(model, datastore_services.Model):
        return None if model.key is None else model.key.id()
    else:
        raise TypeError('%r is not a model instance' % model)


def get_model_property(model, property_name):
    """Returns the given property from a model.

    Args:
        model: datastore_services.Model. The model to inspect.
        property_name: str. The name of the property to extract.

    Returns:
        *. The property's value.

    Raises:
        TypeError. When the argument is not a model.
    """
    if property_name == 'id':
        return get_model_id(model)
    elif property_name == '__key__':
        return get_model_key(model)
    elif isinstance(model, datastore_services.Model):
        return getattr(model, property_name)
    else:
        raise TypeError('%r is not a model instance' % model)


def get_beam_entity_from_model(model):
    """Returns an Apache Beam representation of the given NDB model.

    Args:
        model: datastore_services.Model. The model to convert.

    Returns:
        beam_datastore_types.Entity. The Apache Beam representation of the
        model.
    """
    beam_entity = beam_datastore_types.Entity(
        beam_datastore_types.Key(
            model.key.flat(), project=feconf.OPPIA_PROJECT_ID))
    beam_entity.set_properties(model._to_dict()) # pylint: disable=protected-access
    return beam_entity


def get_model_from_beam_entity(beam_entity):
    """Returns an NDB model representation of the given Apache Beam entity.

    Args:
        beam_entity: beam_datastore_types.Entity. The entity to convert.

    Returns:
        datastore_services.Model. The NDB model representation of the entity.
    """
    beam_key = beam_entity.key.to_client_key()
    model_id = beam_key.id_or_name
    model_class = datastore_services.Model._lookup_model(beam_key.kind) # pylint: disable=protected-access
    return model_class(id=model_id, **beam_entity.properties)


def get_beam_query_from_ndb_query(query):
    """Returns an equivalent Apache Beam query from the given NDB query.

    Args:
        query: datastore_services.Query. The NDB query to convert.

    Returns:
        beam_datastore_types.Query. The equivalent Apache Beam query.
    """
    kind = query.kind
    namespace = query.namespace

    if query.filters:
        filters = _get_beam_filters_from_ndb_filter_node(query.filters)
    else:
        filters = None

    if query.orders:
        order = _get_beam_order_from_ndb_order(query.orders)
    else:
        order = None

    if kind is None and order is None:
        order = ('__key__',)

    return beam_datastore_types.Query(
        kind=kind, namespace=namespace, filters=filters, order=order)


def apply_query_to_models(query, model_list):
    """Applies the query to the list of models by removing elements in-place.

    Args:
        query: beam_datastore_types.Query. The query object representing the
            constraints placed on the models.
        model_list: list(Model). The models to filter.

    Raises:
        ValueError. The kind of model is specified by the Query, but the order
            does not specifiy a sort-by key.
    """
    if query.kind is None and query.order != ('__key__',):
        raise ValueError('Query(kind=None) must also have order=(\'__key__\',)')

    if query.kind:
        model_list[:] = [
            m for m in model_list if get_model_kind(m) == query.kind
        ]

    if query.namespace:
        model_list[:] = [
            m for m in model_list if m.key.namespace() == query.namespace
        ]

    if query.filters:
        model_list[:] = [
            m for m in model_list
            if all(_get_operator(comp)(get_model_property(m, name), value)
                   for name, comp, value in query.filters)
        ]

    if query.order:
        for order in reversed(query.order):
            _sort_by_property_name(model_list, order)

    if query.limit:
        del model_list[query.limit:]


def _get_beam_filters_from_ndb_filter_node(filter_node):
    """Returns an equivalent Apache Beam filter from the given NDB filter node.

    Args:
        filter_node: ndb_query.FilterNode. The filter node to convert.

    Returns:
        tuple(tuple(str, str, str)). The equivalent Apache Beam filters. Items
        are: (property name, comparison operator, property value).
    """
    if isinstance(filter_node, ndb_query.ConjunctionNode):
        nodes = list(filter_node._to_filter().filters) # pylint: disable=protected-access
    elif isinstance(filter_node, ndb_query.FilterNode):
        nodes = [filter_node._to_filter()] # pylint: disable=protected-access
    else:
        raise TypeError(
            '`!=`, `IN`, and `OR` are forbidden filters. To emulate their '
            'behavior, use multiple AND queries and flatten them into a single '
            'PCollection.')

    return [
        (
            pb.property(0).name(),
            datastore_query.PropertyFilter._OPERATORS_INVERSE[pb.op()], # pylint: disable=protected-access
            datastore_types.FromPropertyPb(pb.property(0)),
        )
        for pb in itertools.chain.from_iterable(n._to_pbs() for n in nodes) # pylint: disable=protected-access
    ]


def _get_beam_order_from_ndb_order(order):
    """Returns an equivalent Apache Beam order from the given datastore Order.

    Args:
        order: datastore_query.Order. The datastore order to convert.

    Returns:
        tuple(str). The equivalent Apache Beam order.
    """
    if isinstance(order, datastore_query.CompositeOrder):
        orders = order.orders
    else:
        orders = [order]

    return tuple(
        '%s%s' % ('-' if o.direction == o.DESCENDING else '', o.prop)
        for o in orders)


def _sort_by_property_name(model_list, property_name):
    """Sorts the list of models by the given property.

    Args:
        model_list: list(Model). The models to sort.
        property_name: str. The name of the property to sort by. If the name is
            prefixed by '-', then the models are sorted in reverse order.
    """
    if property_name.startswith('-'):
        reverse = True
        property_name = property_name[1:]
    else:
        reverse = False

    model_list.sort(
        key=lambda model: get_model_property(model, property_name),
        reverse=reverse)


def _get_operator(comp_str):
    """Returns the operator function corresponding to the given comparison.

    Args:
        comp_str: str. One of: '<', '<=', '=', '>=', '>'.

    Returns:
        callable. The binary operator corresponding to the comparison.

    Raises:
        ValueError. The comparison is not supported.
    """
    if comp_str == '<':
        return operator.lt
    elif comp_str == '<=':
        return operator.le
    elif comp_str == '=':
        return operator.eq
    elif comp_str == '>=':
        return operator.ge
    elif comp_str == '>':
        return operator.gt
    else:
        raise ValueError('Unsupported comparison operator: %s' % comp_str)
